import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger, ServiceUnavailableException } from '@nestjs/common'
import { PaymentMethod, PaymentStatus, type PaymentRefundRequest } from '@prisma/client'
import { Job } from 'bullmq'
import { PrismaService } from '../database/prisma.service'
import { SepayProvider } from './providers/sepay.provider'

export interface PaymentRefundJobData {
  refundId: string
  orderId: string
  transactionRef?: string
  amount: number
  reason: string
  kind: 'full' | 'partial'
}

const REFUND_REQUEST_LEASE_MS = 2 * 60_000
const TERMINAL_REFUND_STATUSES = new Set(['completed', 'manual_review'])
const SEPAY_MANUAL_REVIEW_CODE = 'SEPAY_BANK_TRANSFER_REFUND_REQUIRES_MANUAL_REVIEW'

@Processor('payment-refund')
export class RefundProcessor extends WorkerHost {
  private readonly logger = new Logger(RefundProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly sepay: SepayProvider,
  ) {
    super()
  }

  async process(job: Job<PaymentRefundJobData>): Promise<void> {
    const { refundId, orderId, amount, reason, kind } = job.data
    this.validateJob(job.data)

    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: { select: { customerId: true, status: true } } },
    })
    if (!payment) throw new Error('REFUND_PAYMENT_NOT_FOUND')

    const request = await this.ensureRequest(job.data, payment.id, payment.method)
    if (TERMINAL_REFUND_STATUSES.has(request.status)) return

    const jobId = String(job.id ?? refundId)
    const claimed = await this.claimRequest(request, jobId)
    if (!claimed) return

    try {
      if (payment.method === PaymentMethod.sepay) {
        try {
          await this.sepay.refund(
            job.data.transactionRef ?? payment.transactionId,
            amount,
            reason,
          )
        } catch (error) {
          if (error instanceof Error && error.message === SEPAY_MANUAL_REVIEW_CODE) {
            await this.markManualReview(request.id, SEPAY_MANUAL_REVIEW_CODE)
            this.logger.warn(`SePay refund ${refundId} queued for audited manual review`)
            return
          }
          throw error
        }
      } else if (payment.method !== PaymentMethod.wallet) {
        await this.markManualReview(request.id, `REFUND_${payment.method.toUpperCase()}_REQUIRES_MANUAL_REVIEW`)
        return
      }

      const result = await this.prisma.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`

        const currentPayment = await tx.payment.findUnique({
          where: { orderId },
          include: { order: { select: { customerId: true, status: true } } },
        })
        if (!currentPayment) throw new Error('REFUND_PAYMENT_NOT_FOUND')
        if (currentPayment.status === PaymentStatus.refunded && kind === 'full') {
          await tx.paymentRefundRequest.update({
            where: { id: request.id },
            data: { status: 'completed', completedAt: new Date(), failureCode: null },
          })
          return { alreadyCompleted: true, manualReview: false }
        }
        if (currentPayment.status !== PaymentStatus.completed) {
          throw new Error('REFUND_PAYMENT_NOT_CAPTURED')
        }

        const refunded = await tx.paymentRefundRequest.aggregate({
          where: {
            orderId,
            status: 'completed',
            id: { not: request.id },
          },
          _sum: { amount: true },
        })
        const remaining = Number(currentPayment.amount) - (refunded._sum.amount ?? 0)
        if (amount > remaining) {
          await tx.paymentRefundRequest.update({
            where: { id: request.id },
            data: {
              status: 'manual_review',
              failureCode: 'REFUND_AMOUNT_EXCEEDS_REMAINING_CAPTURE',
            },
          })
          return { alreadyCompleted: false, manualReview: true }
        }

        if (currentPayment.method === PaymentMethod.wallet) {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${currentPayment.order.customerId}))`
          await tx.walletTransaction.create({
            data: {
              userId: currentPayment.order.customerId,
              refundRequestId: request.id,
              amountDelta: amount,
              type: 'credit',
              reason: 'order_refund',
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
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: kind === 'full' ? 'refunded' : currentPayment.order.status,
            changedBy: 'system',
            note: kind === 'full'
              ? `Refund processed: ${reason}`
              : `Partial refund processed: ${amount} VND. Reason: ${reason}`,
          },
        })
        await tx.payoutLedger.create({
          data: {
            dedupeKey: `refund-${request.id}-platform`,
            refundRequestId: request.id,
            orderId,
            recipientType: 'platform',
            recipientId: null,
            amount: -amount,
            currency: 'VND',
            status: 'pending',
          },
        })
        await tx.paymentRefundRequest.update({
          where: { id: request.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            failureCode: null,
          },
        })
        return { alreadyCompleted: false, manualReview: false }
      })

      if (result.manualReview) {
        this.logger.warn(`Refund ${refundId} exceeds the remaining captured amount; manual review required`)
        return
      }
      this.logger.log(result.alreadyCompleted
        ? `Refund ${refundId} was already reflected in payment state`
        : `Refund ${refundId} completed`)
    } catch (error) {
      await this.prisma.paymentRefundRequest.updateMany({
        where: { id: request.id, status: 'processing' },
        data: {
          status: 'failed',
          failureCode: safeFailureCode(error),
        },
      })
      throw error
    }
  }

  private validateJob(data: PaymentRefundJobData): void {
    if (!data.refundId || data.refundId.length > 200) throw new Error('REFUND_ID_INVALID')
    if (!Number.isSafeInteger(data.amount) || data.amount <= 0) throw new Error('REFUND_AMOUNT_INVALID')
    if (!data.reason.trim()) throw new Error('REFUND_REASON_REQUIRED')
  }

  private async ensureRequest(
    data: PaymentRefundJobData,
    paymentId: string,
    method: PaymentMethod,
  ): Promise<PaymentRefundRequest> {
    const existing = await this.prisma.paymentRefundRequest.findUnique({
      where: { refundKey: data.refundId },
    })
    if (existing) {
      this.assertRequestMatches(existing, data, paymentId, method)
      return existing
    }

    try {
      return await this.prisma.paymentRefundRequest.create({
        data: {
          refundKey: data.refundId,
          orderId: data.orderId,
          paymentId,
          amount: data.amount,
          kind: data.kind,
          reason: data.reason,
          method,
        },
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error
      const concurrent = await this.prisma.paymentRefundRequest.findUnique({
        where: { refundKey: data.refundId },
      })
      if (!concurrent) throw error
      this.assertRequestMatches(concurrent, data, paymentId, method)
      return concurrent
    }
  }

  private assertRequestMatches(
    request: PaymentRefundRequest,
    data: PaymentRefundJobData,
    paymentId: string,
    method: PaymentMethod,
  ): void {
    if (
      request.orderId !== data.orderId
      || request.paymentId !== paymentId
      || request.amount !== data.amount
      || request.kind !== data.kind
      || request.method !== method
    ) {
      throw new Error('REFUND_REQUEST_CONFLICT')
    }
  }

  private async claimRequest(request: PaymentRefundRequest, jobId: string): Promise<boolean> {
    if (TERMINAL_REFUND_STATUSES.has(request.status)) return false
    if (request.status === 'processing' && request.processingJobId === jobId) return true

    const staleBefore = new Date(Date.now() - REFUND_REQUEST_LEASE_MS)
    const claimed = await this.prisma.paymentRefundRequest.updateMany({
      where: {
        id: request.id,
        OR: [
          { status: { in: ['queued', 'failed'] } },
          { status: 'processing', updatedAt: { lt: staleBefore } },
        ],
      },
      data: {
        status: 'processing',
        processingJobId: jobId,
        attempts: { increment: 1 },
        failureCode: null,
      },
    })
    if (claimed.count === 1) return true
    throw new ServiceUnavailableException('REFUND_REQUEST_PROCESSING')
  }

  private async markManualReview(id: string, failureCode: string): Promise<void> {
    await this.prisma.paymentRefundRequest.update({
      where: { id },
      data: { status: 'manual_review', failureCode },
    })
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: unknown }).code === 'P2002'
}

function safeFailureCode(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  return /^[A-Z][A-Z0-9_]+$/.test(message)
    ? message.slice(0, 100)
    : 'REFUND_PROCESSING_FAILED'
}
