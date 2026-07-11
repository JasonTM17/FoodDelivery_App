import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import type { Request } from 'express'
import { z } from 'zod'
import { PrismaService } from '../database/prisma.service'
import { OrdersGateway } from '../orders/orders.gateway'
import { OrdersService } from '../orders/orders.service'
import { SepayProvider } from '../payments/providers/sepay.provider'

const SEPAY_PROVIDER = 'sepay'
const RECEIPT_PROCESSING_TIMEOUT_MS = 2 * 60_000
const TERMINAL_RECEIPT_STATUSES = new Set(['completed', 'manual_review', 'ignored'])

const sepayWebhookSchema = z.object({
  id: z.number().int().positive(),
  gateway: z.string().trim().min(2).max(50),
  transactionDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
  accountNumber: z.string().trim().min(4).max(64),
  subAccount: z.string().trim().max(64).optional().default(''),
  code: z.string().trim().min(1).max(100).nullable(),
  content: z.string().max(500),
  transferType: z.enum(['in', 'out']),
  description: z.string().max(1000).optional().default(''),
  transferAmount: z.number().int().positive().max(9_999_999_999),
  accumulated: z.number().int().nonnegative().optional(),
  referenceCode: z.string().trim().max(100).optional().default(''),
}).passthrough()

type SepayWebhookPayload = z.infer<typeof sepayWebhookSchema>

interface ReceiptClaim {
  id: string
  duplicate: boolean
  resumed: boolean
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: unknown }).code === 'P2002'
}

function safeFailureCode(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  return /^SEPAY_[A-Z0-9_]+$/.test(message)
    ? message.slice(0, 100)
    : 'SEPAY_WEBHOOK_PROCESSING_FAILED'
}

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly sepay: SepayProvider,
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly ordersGateway: OrdersGateway,
    @InjectQueue('order-timeout') private readonly orderTimeoutQueue: Queue,
  ) {}

  @Post('sepay/payment-success')
  async sepayPaymentSuccess(
    @Req() request: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
    @Headers('x-sepay-signature') signature: string | undefined,
    @Headers('x-sepay-timestamp') timestamp: string | undefined,
  ): Promise<{ success: true }> {
    if (
      !request.rawBody
      || !signature
      || !timestamp
      || !this.sepay.verifyWebhookSignature(request.rawBody, signature, timestamp)
    ) {
      throw new BadRequestException('SEPAY_WEBHOOK_SIGNATURE_INVALID')
    }

    const parsed = sepayWebhookSchema.safeParse(body)
    if (!parsed.success || Number.isNaN(this.parseTransactionDate(parsed.data?.transactionDate).getTime())) {
      throw new BadRequestException('SEPAY_WEBHOOK_PAYLOAD_INVALID')
    }
    const payload = parsed.data
    const claim = await this.claimReceipt(payload)
    if (claim.duplicate) return { success: true }

    try {
      if (payload.transferType === 'out') {
        await this.completeReceipt(claim.id, 'ignored')
        return { success: true }
      }
      if (!this.sepay.matchesPaymentAccount(payload.accountNumber, payload.subAccount)) {
        await this.markManualReview(claim.id, payload, 'SEPAY_WEBHOOK_ACCOUNT_MISMATCH')
        return { success: true }
      }
      if (!payload.code) {
        await this.markManualReview(claim.id, payload, 'SEPAY_WEBHOOK_PAYMENT_CODE_MISSING')
        return { success: true }
      }

      const transactionRef = payload.code.toUpperCase()
      const intent = await this.prisma.paymentIntent.findUnique({ where: { transactionRef } })
      if (!intent) {
        await this.markManualReview(claim.id, payload, 'SEPAY_WEBHOOK_PAYMENT_CODE_UNKNOWN')
        return { success: true }
      }

      const order = await this.prisma.order.findUnique({
        where: { id: intent.orderId },
        include: {
          orderItems: { select: { nameSnapshot: true, quantity: true } },
          payment: { select: { transactionId: true } },
        },
      })
      if (!order) {
        await this.markManualReview(
          claim.id,
          payload,
          'SEPAY_WEBHOOK_ORDER_UNKNOWN',
          intent.id,
          intent.orderId,
        )
        return { success: true }
      }

      await this.attachReceipt(claim.id, intent.id, order.id)
      if (payload.transferAmount !== intent.amount) {
        await this.markManualReview(
          claim.id,
          payload,
          'SEPAY_WEBHOOK_AMOUNT_MISMATCH',
          intent.id,
          order.id,
          order.status,
          order.orderCode,
        )
        return { success: true }
      }
      if (order.status === 'created') {
        await this.markManualReview(
          claim.id,
          payload,
          'SEPAY_WEBHOOK_ORDER_STATE_INVALID',
          intent.id,
          order.id,
          order.status,
          order.orderCode,
        )
        return { success: true }
      }

      const wasCompleted = intent.status === 'completed'
      const providerTransactionId = this.providerTransactionId(payload.id)
      if (wasCompleted && !claim.resumed) {
        await this.markManualReview(
          claim.id,
          payload,
          'SEPAY_WEBHOOK_DUPLICATE_PAYMENT',
          intent.id,
          order.id,
          order.status,
          order.orderCode,
        )
        return { success: true }
      }
      if (wasCompleted && claim.resumed && order.payment?.transactionId !== providerTransactionId) {
        await this.markManualReview(
          claim.id,
          payload,
          'SEPAY_WEBHOOK_PAYMENT_RECONCILIATION_REQUIRED',
          intent.id,
          order.id,
          order.status,
          order.orderCode,
        )
        return { success: true }
      }

      const paidAt = this.parseTransactionDate(payload.transactionDate)
      await this.prisma.$transaction([
        this.prisma.payment.upsert({
          where: { orderId: intent.orderId },
          update: {
            amount: intent.amount,
            method: 'sepay',
            status: 'completed',
            transactionId: providerTransactionId,
            paidAt,
          },
          create: {
            orderId: intent.orderId,
            amount: intent.amount,
            method: 'sepay',
            status: 'completed',
            transactionId: providerTransactionId,
            paidAt,
          },
        }),
        this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'completed' },
        }),
      ])

      if (order.status === 'cancelled' || order.status === 'refunded') {
        if (!wasCompleted) {
          await this.recordOrderReview(
            order.id,
            order.status,
            order.orderCode,
            payload,
            'SEPAY_WEBHOOK_LATE_PAYMENT',
          )
        }
        await this.completeReceipt(claim.id, 'manual_review', 'SEPAY_WEBHOOK_LATE_PAYMENT')
        return { success: true }
      }

      let resultingStatus = order.status
      let releasedToRestaurant = false
      if (resultingStatus === 'pending_payment') {
        await this.orders.transition(intent.orderId, 'paid', 'system', 'system', 'SePay payment confirmed')
        resultingStatus = 'paid'
      }
      if (resultingStatus === 'paid') {
        await this.orders.transition(
          intent.orderId,
          'restaurant_pending',
          'system',
          'system',
          'SePay payment confirmed',
        )
        resultingStatus = 'restaurant_pending'
        releasedToRestaurant = true
      }

      if (resultingStatus === 'restaurant_pending') {
        await this.orderTimeoutQueue.add(
          'restaurant-accept-timeout',
          {
            orderId: intent.orderId,
            expectedStatus: 'restaurant_pending',
            targetStatus: 'cancelled',
            reason: 'Restaurant did not accept order in time',
          },
          {
            delay: 5 * 60_000,
            jobId: `timeout-${intent.orderId}-restaurant-accept`,
            removeOnComplete: true,
          },
        )
        if (releasedToRestaurant || claim.resumed || !wasCompleted) {
          this.ordersGateway.notifyRestaurant(order.restaurantId, {
            orderId: order.id,
            orderCode: order.orderCode,
            total: Number(order.total),
            items: order.orderItems.map(item => ({
              name: item.nameSnapshot,
              quantity: item.quantity,
            })),
          })
        }
      }

      await this.completeReceipt(claim.id, 'completed')
      return { success: true }
    } catch (error) {
      await this.prisma.paymentWebhookReceipt.updateMany({
        where: { id: claim.id, status: 'processing' },
        data: { status: 'failed', failureCode: safeFailureCode(error) },
      })
      throw error
    }
  }

  private async claimReceipt(payload: SepayWebhookPayload): Promise<ReceiptClaim> {
    const providerTransactionId = String(payload.id)
    try {
      const receipt = await this.prisma.paymentWebhookReceipt.create({
        data: {
          provider: SEPAY_PROVIDER,
          providerTransactionId,
          amount: payload.transferAmount,
          bankReference: payload.referenceCode || null,
        },
      })
      return { id: receipt.id, duplicate: false, resumed: false }
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error
    }

    const receipt = await this.prisma.paymentWebhookReceipt.findUnique({
      where: {
        provider_providerTransactionId: {
          provider: SEPAY_PROVIDER,
          providerTransactionId,
        },
      },
    })
    if (!receipt) throw new ServiceUnavailableException('SEPAY_WEBHOOK_RECEIPT_LOOKUP_FAILED')
    if (TERMINAL_RECEIPT_STATUSES.has(receipt.status)) {
      return { id: receipt.id, duplicate: true, resumed: false }
    }

    const staleBefore = new Date(Date.now() - RECEIPT_PROCESSING_TIMEOUT_MS)
    const reclaimable = receipt.status === 'failed'
      || (receipt.status === 'processing' && receipt.updatedAt <= staleBefore)
    if (!reclaimable) {
      throw new ServiceUnavailableException('SEPAY_WEBHOOK_RECEIPT_PROCESSING')
    }

    const reclaimed = await this.prisma.paymentWebhookReceipt.updateMany({
      where: {
        id: receipt.id,
        OR: [
          { status: 'failed' },
          { status: 'processing', updatedAt: { lte: staleBefore } },
        ],
      },
      data: {
        status: 'processing',
        failureCode: null,
        amount: payload.transferAmount,
        bankReference: payload.referenceCode || null,
        processedAt: null,
      },
    })
    if (reclaimed.count !== 1) {
      throw new ServiceUnavailableException('SEPAY_WEBHOOK_RECEIPT_PROCESSING')
    }
    return { id: receipt.id, duplicate: false, resumed: true }
  }

  private async attachReceipt(id: string, paymentIntentId: string, orderId: string): Promise<void> {
    await this.prisma.paymentWebhookReceipt.update({
      where: { id },
      data: { paymentIntentId, orderId },
    })
  }

  private async completeReceipt(id: string, status: string, failureCode?: string): Promise<void> {
    await this.prisma.paymentWebhookReceipt.update({
      where: { id },
      data: {
        status,
        failureCode: failureCode ?? null,
        processedAt: new Date(),
      },
    })
  }

  private async markManualReview(
    receiptId: string,
    payload: SepayWebhookPayload,
    reason: string,
    paymentIntentId?: string,
    orderId?: string,
    orderStatus?: string,
    orderCode?: string,
  ): Promise<void> {
    if (orderId && orderStatus && orderCode) {
      await this.recordOrderReview(orderId, orderStatus, orderCode, payload, reason)
    }
    await this.prisma.paymentWebhookReceipt.update({
      where: { id: receiptId },
      data: {
        paymentIntentId,
        orderId,
        status: 'manual_review',
        failureCode: reason,
        processedAt: new Date(),
      },
    })
    if (!orderId) {
      this.ordersGateway.notifyAdmins('admin:sepay_payment_review', {
        providerTransactionId: String(payload.id),
        bankReference: payload.referenceCode || null,
        amount: payload.transferAmount,
        reason,
        timestamp: new Date().toISOString(),
      })
    }
  }

  private async recordOrderReview(
    orderId: string,
    orderStatus: string,
    orderCode: string,
    payload: SepayWebhookPayload,
    reason: string,
  ): Promise<void> {
    const providerTransactionId = this.providerTransactionId(payload.id)
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: orderStatus,
        changedBy: 'system',
        note: `${reason}: SePay payment ${providerTransactionId} requires manual review`,
      },
    })
    this.ordersGateway.notifyAdmins('admin:sepay_payment_review', {
      orderId,
      orderCode,
      providerTransactionId,
      bankReference: payload.referenceCode || null,
      amount: payload.transferAmount,
      reason,
      timestamp: new Date().toISOString(),
    })
  }

  private providerTransactionId(id: number): string {
    return `SEPAY-${id}`
  }

  private parseTransactionDate(value: string | undefined): Date {
    if (!value) return new Date(Number.NaN)
    return new Date(`${value.replace(' ', 'T')}+07:00`)
  }
}
