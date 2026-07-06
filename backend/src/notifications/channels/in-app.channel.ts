import { forwardRef, Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { NotificationsGateway } from '../notifications.gateway'
import { NotificationChannel, ChannelPayload, ChannelResult } from './notification-channel.interface'

@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly name = 'in_app'
  private readonly logger = new Logger(InAppChannel.name)

  constructor(
    @Optional()
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway?: NotificationsGateway,
  ) {}

  async send(userId: string, payload: ChannelPayload): Promise<ChannelResult> {
    if (!this.gateway) {
      this.logger.warn(`Gateway unavailable; skipping in-app for user ${userId}`)
      return { success: false, error: 'Gateway unavailable' }
    }
    if (!payload.notification) {
      this.logger.error(`Canonical notification payload missing for user ${userId}`)
      return { success: false, error: 'CANONICAL_NOTIFICATION_REQUIRED' }
    }
    try {
      this.gateway.sendToUser(userId, payload.notification)
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.logger.error(`In-app send failed for user ${userId}: ${msg}`)
      return { success: false, error: msg }
    }
  }
}
