import {
  Controller,
  Post,
  Body,
  Headers,
  Inject,
  BadRequestException,
  Req,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import type Redis from 'ioredis'
import type { Request } from 'express'
import { SepayProvider } from '../payments/providers/sepay.provider'
import { PrismaService } from '../database/prisma.service'
import { OrdersGateway } from '../orders/orders.gateway'
import { OrdersService } from '../orders/orders.service'

type RawBodyRequest = Request & { rawBody?: Buffer }

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly sepay: SepayProvider,
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly ordersGateway: OrdersGateway,
    @InjectQueue('commission-split') private readonly commissionQueue: Queue,
    @InjectQueue('order-timeout') private readonly orderTimeoutQueue: Queue,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Post('sepay/payment-success')
  async sepayPaymentSuccess(
    @Req() req: RawBodyRequest,
    @Body() body: Record<string, unknown>,
    @Headers('x-sepay-signature') signature: string | undefined,
  ) {
    // Prefer raw body bytes for HMAC; fall back to stable JSON only if rawBody not wired
    const rawBody =
      req.rawBody?.toString('utf8') ??
      (typeof req.body === 'string' ? req.body : JSON.stringify(body))

    if (!signature || !this.sepay.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid SePay signature')
    }

    const transactionRef = body['transaction_ref'] as string | undefined
    if (!transactionRef) {
      throw new BadRequestException('Missing transaction_ref')
    }

    // Claim dedupe before side effects (SET NX) so concurrent webhooks cannot double-apply
    const dedupeKey = `sepay:webhook:dedup:${transactionRef}`
    const claimed = await this.redis.set(dedupeKey, 'processing', 'EX', 120, 'NX')
    if (!claimed) {
      return { received: true, duplicate: true }
    }

    try {
      const intent = await this.prisma.paymentIntent.findUnique({ where: { transactionRef } })
      if (!intent) {
        throw new BadRequestException(`Unknown transaction_ref: ${transactionRef}`)
      }

      if (intent.status === 'completed') {
        await this.redis.set(dedupeKey, '1', 'EX', 24 * 3600)
        return { received: true, duplicate: true }
      }

      if (intent.expiresAt && intent.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException('Payment intent expired')
      }

      // Amount reconciliation when provider sends amount fields
      const paidAmount = this.extractPaidAmount(body)
      if (paidAmount != null && paidAmount !== Number(intent.amount)) {
        throw new BadRequestException(
          `Amount mismatch: expected ${intent.amount}, got ${paidAmount}`,
        )
      }

      const order = await this.prisma.order.findUnique({
        where: { id: intent.orderId },
        include: {
          orderItems: { select: { nameSnapshot: true, quantity: true } },
        },
      })
      if (!order) {
        throw new BadRequestException(`Unknown order for transaction_ref: ${transactionRef}`)
      }

      // Do not complete money-side effects for cancelled / refunded / terminal orders
      if (order.status === 'cancelled' || order.status === 'refunded' || order.status === 'completed') {
        throw new BadRequestException(`Order not payable in status ${order.status}`)
      }

      const payableStatuses = new Set(['created', 'pending_payment'])
      if (!payableStatuses.has(order.status)) {
        // Already advanced — treat as idempotent success without re-ledgering
        if (order.status === 'paid' || order.status === 'restaurant_pending' || order.status === 'restaurant_accepted') {
          await this.prisma.payment.upsert({
            where: { orderId: intent.orderId },
            update: { status: 'completed', transactionId: transactionRef, paidAt: new Date() },
            create: {
              orderId: intent.orderId,
              amount: intent.amount,
              method: 'sepay',
              status: 'completed',
              transactionId: transactionRef,
              paidAt: new Date(),
            },
          })
          await this.prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: 'completed' },
          })
          await this.redis.set(dedupeKey, '1', 'EX', 24 * 3600)
          return { received: true, alreadyFulfilled: true }
        }
        throw new BadRequestException(`Order not payable in status ${order.status}`)
      }

      await this.prisma.payment.upsert({
        where: { orderId: intent.orderId },
        update: { status: 'completed', transactionId: transactionRef, paidAt: new Date() },
        create: {
          orderId: intent.orderId,
          amount: intent.amount,
          method: 'sepay',
          status: 'completed',
          transactionId: transactionRef,
          paidAt: new Date(),
        },
      })

      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: 'completed' },
      })

      // Ensure pending_payment before paid (state machine) if still at created (legacy rows)
      if (order.status === 'created') {
        await this.orders.transition(intent.orderId, 'pending_payment', 'system', 'system', 'SePay payment confirmed')
      }
      if (order.status === 'created' || order.status === 'pending_payment') {
        await this.orders.transition(intent.orderId, 'paid', 'system', 'system', 'SePay payment confirmed')
        await this.orders.transition(intent.orderId, 'restaurant_pending', 'system', 'system', 'SePay payment confirmed')
        await this.orderTimeoutQueue.add(
          'restaurant-accept-timeout',
          {
            orderId: intent.orderId,
            expectedStatus: 'restaurant_pending',
            targetStatus: 'cancelled',
            reason: 'Restaurant did not accept order in time',
          },
          { delay: 5 * 60_000, jobId: `timeout:${intent.orderId}:restaurant-accept`, removeOnComplete: true },
        )
        this.ordersGateway.notifyRestaurant(order.restaurantId, {
          orderId: order.id,
          orderCode: order.orderCode,
          total: Number(order.total),
          items: order.orderItems.map(item => ({ name: item.nameSnapshot, quantity: item.quantity })),
        })
      }

      await this.commissionQueue.add(
        'commission-split',
        { orderId: intent.orderId },
        { jobId: `commission:${intent.orderId}`, removeOnComplete: true },
      )
      await this.redis.set(dedupeKey, '1', 'EX', 24 * 3600)

      return { received: true }
    } catch (error) {
      await this.redis.del(dedupeKey)
      throw error
    }
  }

  private extractPaidAmount(body: Record<string, unknown>): number | null {
    const candidates = [body['amount'], body['amount_in'], body['transferAmount'], body['transfer_amount']]
    for (const c of candidates) {
      if (c == null) continue
      const n = typeof c === 'number' ? c : Number(String(c).replace(/[^\d.-]/g, ''))
      if (Number.isFinite(n) && n > 0) return Math.trunc(n)
    }
    return null
  }
}
