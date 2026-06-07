import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import type Redis from 'ioredis'
import { PrismaService } from '../database/prisma.service'
import { SepayProvider } from './providers/sepay.provider'
import { PayoutLedgerService } from './payout-ledger.service'

export interface PaymentRefundJobData {
  orderId: string
  transactionRef: string
  amount: number
  reason: string
  attemptNo: number
}

// Exponential backoff delays in ms: 30s, 90s, 270s
const BACKOFF_DELAYS_MS = [30_000, 90_000, 270_000]

@Processor('payment-refund')
export class RefundProcessor extends WorkerHost {
  private readonly logger = new Logger(RefundProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly sepay: SepayProvider,
    private readonly ledger: PayoutLedgerService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    super()
  }

  async process(job: Job<PaymentRefundJobData>): Promise<void> {
    const { orderId, transactionRef, amount, reason, attemptNo } = job.data
    const dedupeKey = `refund:${orderId}:${attemptNo}`

    const alreadyProcessed = await this.redis.get(dedupeKey)
    if (alreadyProcessed) {
      this.logger.log(`Refund ${dedupeKey} already completed — skipping duplicate`)
      return
    }

    if (attemptNo > BACKOFF_DELAYS_MS.length) {
      this.logger.error(`Refund exhausted all retries for order ${orderId}`)
      return
    }

    try {
      await this.sepay.refund(transactionRef, amount, reason)

      await this.prisma.payment.update({
        where: { orderId },
        data: { status: 'refunded' },
      })

      // Ledger reversal entry — negative amount records the outflow
      await this.ledger.insertEntry({
        orderId,
        recipientType: 'platform',
        amount: -amount,
        currency: 'VND',
      })

      // Idempotency key — TTL 7 days to cover settlement window
      await this.redis.set(dedupeKey, '1', 'EX', 7 * 24 * 3600)

      this.logger.log(`Refund completed for order ${orderId} attempt ${attemptNo}`)
    } catch (err) {
      const delay = BACKOFF_DELAYS_MS[attemptNo - 1] ?? 270_000
      this.logger.warn(
        `Refund attempt ${attemptNo} failed for order ${orderId}: ${(err as Error).message} — retry in ${delay}ms`,
      )
      throw err
    }
  }
}
