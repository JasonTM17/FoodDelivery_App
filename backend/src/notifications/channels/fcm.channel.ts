import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { QUEUE_FCM } from '../notifications.constants'
import { NotificationChannel, ChannelPayload, ChannelResult } from './notification-channel.interface'

export interface FcmJobData {
  userId: string
  title: string
  body: string
  data?: Record<string, unknown>
}

@Injectable()
export class FcmChannel implements NotificationChannel {
  readonly name = 'push'
  private readonly logger = new Logger(FcmChannel.name)

  constructor(
    @InjectQueue(QUEUE_FCM) private readonly queue: Queue,
  ) {}

  async send(userId: string, payload: ChannelPayload): Promise<ChannelResult> {
    try {
      const job = await this.queue.add(
        'send-fcm',
        {
          userId,
          title: payload.title,
          body: payload.body,
          data: payload.data,
        } satisfies FcmJobData,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      )
      return { success: true, messageId: job.id?.toString() }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.logger.error(`FCM enqueue failed for user ${userId}: ${msg}`)
      return { success: false, error: msg }
    }
  }
}
