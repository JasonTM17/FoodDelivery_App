import {
  Controller,
  Post,
  Body,
  Headers,
  Inject,
  BadRequestException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import type Redis from 'ioredis'
import { SepayProvider } from '../payments/providers/sepay.provider'
import { PrismaService } from '../database/prisma.service'
import { OrdersGateway } from '../orders/orders.gateway'
import { OrdersService } from '../orders/orders.service'

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
    @Body() body: Record<string, unknown>,
    @Headers('x-sepay-signature') signature: string | undefined,
  ) {
    // Signature check — uses JSON.stringify; enable rawBody in bootstrap for strict verification
    if (!signature || !this.sepay.verifyWebhookSignature(JSON.stringify(body), signature)) {
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

      const order = await this.prisma.order.findUnique({
        where: { id: intent.orderId },
        include: {
          orderItems: { select: { nameSnapshot: true, quantity: true } },
        },
      })
      if (!order) {
        throw new BadRequestException(`Unknown order for transaction_ref: ${transactionRef}`)
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

      if (order.status === 'pending_payment') {
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

      await this.commissionQueue.add('commission-split', { orderId: intent.orderId })
      // Promote claim to durable 24h dedupe only after successful side effects
      await this.redis.set(dedupeKey, '1', 'EX', 24 * 3600)

      return { received: true }
    } catch (error) {
      // Allow provider retries after failed processing
      await this.redis.del(dedupeKey)
      throw error
    }
  }
}
