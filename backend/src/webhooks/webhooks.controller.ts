import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common'
import { ApiKeyGuard } from '../auth/api-key.guard'
import { NotificationsService } from '../notifications/notifications.service'

@Controller('webhooks')
@UseGuards(ApiKeyGuard)
export class WebhooksController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('n8n/order-event')
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
  getDelayedOrders(@Query('threshold') threshold: string) {
    return { orders: [], threshold: parseInt(threshold ?? '15') }
  }

  @Get('stopped-drivers')
  getStoppedDrivers(@Query('minutes') minutes: string) {
    return { drivers: [], minutes: parseInt(minutes ?? '10') }
  }

  @Get('lapsed-customers')
  getLapsedCustomers(@Query('days') days: string) {
    return { customers: [], days: parseInt(days ?? '14') }
  }
}
