import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { AuthModule } from '../auth/auth.module'
import { RedisModule } from '../redis/redis.module'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { NotificationsGateway } from './notifications.gateway'
import { InAppChannel } from './channels/in-app.channel'
import { FcmChannel } from './channels/fcm.channel'
import { FcmProcessor } from './channels/fcm.processor'
import { SmtpChannel } from './channels/smtp.channel'
import { SmtpProcessor } from './channels/smtp.processor'
import { TwilioChannel } from './channels/twilio.channel'
import { TwilioProcessor } from './channels/twilio.processor'
import { TemplateLoader } from './templates/template.loader'
import { QUEUE_FCM, QUEUE_SMTP, QUEUE_TWILIO } from './notifications.constants'

@Module({
  imports: [
    AuthModule,
    RedisModule,
    BullModule.registerQueue(
      { name: QUEUE_FCM },
      { name: QUEUE_SMTP },
      { name: QUEUE_TWILIO },
    ),
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
    TemplateLoader,
    InAppChannel,
    FcmChannel,
    FcmProcessor,
    SmtpChannel,
    SmtpProcessor,
    TwilioChannel,
    TwilioProcessor,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
