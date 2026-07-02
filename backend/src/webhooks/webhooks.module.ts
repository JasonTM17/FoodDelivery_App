import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { WebhooksController } from './webhooks.controller'
import { WebhooksService } from './webhooks.service'
import { NotificationsModule } from '../notifications/notifications.module'
import { PaymentsModule } from '../payments/payments.module'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [
    NotificationsModule,
    PaymentsModule,
    OrdersModule,
    BullModule.registerQueue({ name: 'commission-split' }),
    BullModule.registerQueue({ name: 'order-timeout' }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
