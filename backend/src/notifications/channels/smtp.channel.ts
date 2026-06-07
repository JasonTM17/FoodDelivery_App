import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { QUEUE_SMTP } from '../notifications.constants'
import { NotificationChannel, ChannelPayload, ChannelResult } from './notification-channel.interface'

export interface SmtpJobData {
  userId: string
  title: string
  body: string
  critical?: boolean
}

@Injectable()
export class SmtpChannel implements NotificationChannel {
  readonly name = 'email'
  private readonly logger = new Logger(SmtpChannel.name)

  constructor(
    @InjectQueue(QUEUE_SMTP) private readonly queue: Queue,
  ) {}

  async send(userId: string, payload: ChannelPayload): Promise<ChannelResult> {
    try {
      const job = await this.queue.add(
        'send-email',
        {
          userId,
          title: payload.title,
          body: payload.body,
          critical: payload.critical,
        } satisfies SmtpJobData,
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      )
      return { success: true, messageId: job.id?.toString() }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.logger.error(`SMTP enqueue failed for user ${userId}: ${msg}`)
      return { success: false, error: msg }
    }
  }
}
