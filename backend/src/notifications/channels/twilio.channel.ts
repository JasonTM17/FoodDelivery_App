import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { QUEUE_TWILIO, CRITICAL_EVENTS } from '../notifications.constants'
import { NotificationChannel, ChannelPayload, ChannelResult } from './notification-channel.interface'

export interface TwilioJobData {
  userId: string
  body: string
  eventType: string
}

@Injectable()
export class TwilioChannel implements NotificationChannel {
  readonly name = 'sms'
  private readonly logger = new Logger(TwilioChannel.name)

  constructor(
    @InjectQueue(QUEUE_TWILIO) private readonly queue: Queue,
  ) {}

  async send(userId: string, payload: ChannelPayload): Promise<ChannelResult> {
    const eventType = (payload.data?.eventType as string) ?? ''

    if (!CRITICAL_EVENTS.has(eventType)) {
      return { success: true, messageId: 'skipped-not-critical' }
    }

    try {
      const job = await this.queue.add(
        'send-sms',
        { userId, body: payload.body, eventType } satisfies TwilioJobData,
        {
          attempts: 2,
          backoff: { type: 'fixed', delay: 5000 },
          removeOnComplete: 50,
          removeOnFail: 50,
        },
      )
      return { success: true, messageId: job.id?.toString() }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.logger.error(`Twilio enqueue failed for user ${userId}: ${msg}`)
      return { success: false, error: msg }
    }
  }
}
