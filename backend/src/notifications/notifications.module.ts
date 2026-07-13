import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { RedisModule } from '../redis/redis.module'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { NotificationsGateway } from './notifications.gateway'
import { InAppChannel } from './channels/in-app.channel'
import { FcmChannel } from './channels/fcm.channel'
import { FcmProcessor } from './channels/fcm.processor'
import {
  FCM_MESSAGING_CLIENT,
  FirebaseAdminMessagingClient,
} from './channels/firebase-admin-messaging.client'
import { SmtpChannel } from './channels/smtp.channel'
import { SmtpProcessor } from './channels/smtp.processor'
import { TwilioChannel } from './channels/twilio.channel'
import { TwilioProcessor } from './channels/twilio.processor'
import { TemplateLoader } from './templates/template.loader'
import { QUEUE_FCM, QUEUE_SMTP, QUEUE_TWILIO } from './notifications.constants'
import { QueueProviderModule } from '../common/queue/queue-provider.module'

@Module({
  imports: [
    AuthModule,
    RedisModule,
    QueueProviderModule.registerQueue(
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
    FirebaseAdminMessagingClient,
    { provide: FCM_MESSAGING_CLIENT, useExisting: FirebaseAdminMessagingClient },
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
