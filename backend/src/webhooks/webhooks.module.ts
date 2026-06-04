import { Module } from '@nestjs/common'
import { WebhooksController } from './webhooks.controller'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [NotificationsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
