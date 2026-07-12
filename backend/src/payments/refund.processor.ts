import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { Job } from 'bullmq'
import type Redis from 'ioredis'
import { PrismaService } from '../database/prisma.service'
import { SepayProvider } from './providers/sepay.provider'

export interface PaymentRefundJobData {
  refundId: string
  orderId: string
  transactionRef?: string
  amount: number
  reason: string
  kind: 'full' | 'partial'
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
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    super()
  }

  async process(job: Job<PaymentRefundJobData>): Promise<void> {
    const { refundId, orderId, amount, reason, kind, attemptNo } = job.data
    const normalizedAmount = Math.trunc(amount)
    const dedupeKey = `refund:${refundId}:attempt:${attemptNo}`

    const alreadyProcessed = await this.redis.get(dedupeKey)
    if (alreadyProcessed) {
      this.logger.log(`Refund ${dedupeKey} already completed — skipping duplicate`)
      return
    }

    if (attemptNo > BACKOFF_DELAYS_MS.length) {
      this.logger.error(`Refund exhausted all retries for order ${orderId}`)
      return
    }

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new Error(`Invalid refund amount for order ${orderId}`)
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: { select: { customerId: true, status: true } } },
    })
    if (!payment) {
      throw new Error(`No payment found for order ${orderId}`)
    }
    if (payment.status === PaymentStatus.refunded && kind === 'full') {
      await this.redis.set(dedupeKey, '1', 'EX', 7 * 24 * 3600)
      this.logger.log(`Refund ${refundId} already reflected in payment status — skipping duplicate`)
      return
    }
    if (payment.status !== PaymentStatus.completed) {
      throw new Error(`Cannot refund payment with status ${payment.status}`)
    }
    if (normalizedAmount > Number(payment.amount)) {
      throw new Error(`Refund amount exceeds captured payment for order ${orderId}`)
    }

    try {
      let sepayWalletRecovery = false
      if (payment.method === PaymentMethod.sepay) {
        const transactionRef = job.data.transactionRef ?? payment.transactionId
        if (!transactionRef) {
          throw new Error(`Missing SePay transaction reference for order ${orderId}`)
        }
        try {
          await this.sepay.refund(transactionRef, normalizedAmount, reason)
        } catch (err) {
          // Bank refund not modelled: credit FoodFlow wallet so customer is not left unpaid
          const msg = (err as Error).message ?? ''
          if (msg.includes('SEPAY_REFUND_NOT_MODELLED') || (err as { status?: number }).status === 501) {
            sepayWalletRecovery = true
            this.logger.warn(
              `SePay bank refund not modelled for ${orderId} — crediting wallet ${normalizedAmount} VND as recovery`,
            )
          } else {
            throw err
          }
        }
      } else if (payment.method !== PaymentMethod.wallet) {
        throw new Error(`Refund is not supported for ${payment.method} payments`)
      }

      await this.prisma.$transaction(async (tx) => {
        // Lock first so concurrent partial refunds cannot both pass the cap check
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${payment.order.customerId}))`

        // Cumulative refund guard: sum prior wallet credits for this order
        const priorCredits = await tx.walletTransaction.aggregate({
          where: {
            userId: payment.order.customerId,
            refId: orderId,
            type: 'credit',
            reason: { in: ['order_refund', 'sepay_refund_wallet_recovery'] },
            status: 'CONFIRMED',
          },
          _sum: { amountDelta: true },
        })
        const alreadyRefunded = priorCredits._sum.amountDelta ?? 0
        if (alreadyRefunded + normalizedAmount > Number(payment.amount)) {
          throw new Error(
            `Cumulative refund would exceed payment for order ${orderId}: already=${alreadyRefunded} next=${normalizedAmount} cap=${payment.amount}`,
          )
        }

        if (payment.method === PaymentMethod.wallet || sepayWalletRecovery) {
          await tx.walletTransaction.create({
            data: {
              userId: payment.order.customerId,
              amountDelta: normalizedAmount,
              type: 'credit',
              reason: sepayWalletRecovery ? 'sepay_refund_wallet_recovery' : 'order_refund',
              refId: orderId,
              status: 'CONFIRMED',
            },
          })
        }

        if (kind === 'full') {
          await tx.payment.update({
            where: { orderId },
            data: { status: PaymentStatus.refunded },
          })
          await tx.order.update({
            where: { id: orderId },
            data: { status: 'refunded' },
          })
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              status: 'refunded',
              changedBy: 'system',
              note: sepayWalletRecovery
                ? `Refund via wallet recovery (SePay bank API not modelled): ${reason}`
                : `Refund processed: ${reason}`,
            },
          })
        } else {
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              status: payment.order.status,
              changedBy: 'system',
              note: `Partial refund processed: ${normalizedAmount} VND. Reason: ${reason}`,
            },
          })
        }

        await tx.payoutLedger.create({
          data: {
            orderId,
            recipientType: 'platform',
            recipientId: null,
            amount: -normalizedAmount,
            currency: 'VND',
            status: 'pending',
          },
        })
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
