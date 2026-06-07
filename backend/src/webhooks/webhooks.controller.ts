import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  UseGuards,
  Inject,
  BadRequestException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import type Redis from 'ioredis'
import { ApiKeyGuard } from '../auth/api-key.guard'
import { NotificationsService } from '../notifications/notifications.service'
import { SepayProvider } from '../payments/providers/sepay.provider'
import { PrismaService } from '../database/prisma.service'

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly sepay: SepayProvider,
    private readonly prisma: PrismaService,
    @InjectQueue('commission-split') private readonly commissionQueue: Queue,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Post('n8n/order-event')
  @UseGuards(ApiKeyGuard)
  async orderEvent(@Body() body: { orderId: string; event: string; userId: string }) {
    await this.notifications.create({
      userId: body.userId,
      title: 'Cập nhật đơn hàng',
      body: `Đơn ${body.orderId}: ${body.event}`,
      type: 'order_update',
      payload: { orderId: body.orderId, event: body.event },
    })
    return { received: true }
  }

  @Post('n8n/driver-delay')
  @UseGuards(ApiKeyGuard)
  async driverDelay(@Body() body: { orderId: string; driverId: string; delayMinutes: number }) {
    await this.notifications.create({
      userId: body.driverId,
      title: 'Cảnh báo trễ giao hàng',
      body: `Đơn ${body.orderId} đang trễ ${body.delayMinutes} phút`,
      type: 'driver_alert',
    })
    return { received: true }
  }

  @Get('delayed-orders')
  @UseGuards(ApiKeyGuard)
  getDelayedOrders(@Query('threshold') threshold: string) {
    return { orders: [], threshold: parseInt(threshold ?? '15') }
  }

  @Get('stopped-drivers')
  @UseGuards(ApiKeyGuard)
  getStoppedDrivers(@Query('minutes') minutes: string) {
    return { drivers: [], minutes: parseInt(minutes ?? '10') }
  }

  @Get('lapsed-customers')
  @UseGuards(ApiKeyGuard)
  getLapsedCustomers(@Query('days') days: string) {
    return { customers: [], days: parseInt(days ?? '14') }
  }

  @Post('sepay/payment-success')
  async sepayPaymentSuccess(
    @Body() body: Record<string, unknown>,
    @Headers('x-sepay-signature') signature: string | undefined,
  ) {
    // Signature check — uses JSON.stringify; enable rawBody in bootstrap for strict verification
    if (signature && !this.sepay.verifyWebhookSignature(JSON.stringify(body), signature)) {
      throw new BadRequestException('Invalid SePay signature')
    }

    const transactionRef = body['transaction_ref'] as string | undefined
    if (!transactionRef) {
      throw new BadRequestException('Missing transaction_ref')
    }

    // Replay dedup — 24 h window
    const dedupeKey = `sepay:webhook:dedup:${transactionRef}`
    const seen = await this.redis.get(dedupeKey)
    if (seen) {
      return { received: true, duplicate: true }
    }

    const intent = await this.prisma.paymentIntent.findUnique({ where: { transactionRef } })
    if (!intent) {
      throw new BadRequestException(`Unknown transaction_ref: ${transactionRef}`)
    }

    await this.prisma.payment.upsert({
      where: { orderId: intent.orderId },
      update: { status: 'completed', paidAt: new Date() },
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

    await this.commissionQueue.add('commission-split', { orderId: intent.orderId })
    await this.redis.set(dedupeKey, '1', 'EX', 24 * 3600)

    return { received: true }
  }
}
