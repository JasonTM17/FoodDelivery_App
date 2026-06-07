import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { WebhooksController } from './webhooks.controller'
import { WebhooksService } from './webhooks.service'
import { NotificationsModule } from '../notifications/notifications.module'
import { PaymentsModule } from '../payments/payments.module'

@Module({
  imports: [
    NotificationsModule,
    PaymentsModule,
    BullModule.registerQueue({ name: 'commission-split' }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
