import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import { QUEUE_FCM, FCM_BATCH_SIZE } from '../notifications.constants'
import { FcmJobData } from './fcm.channel'
import Redis from 'ioredis'

interface FcmTokenRow {
  id: string
  token: string
}

interface FcmBatchResult {
  message_id?: string
  error?: string
}

interface FcmResponse {
  multicast_id: number
  success: number
  failure: number
  results: FcmBatchResult[]
}

@Processor(QUEUE_FCM)
export class FcmProcessor extends WorkerHost {
  private readonly logger = new Logger(FcmProcessor.name)
  private readonly fcmUrl = 'https://fcm.googleapis.com/fcm/send'

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    super()
  }

  async process(job: Job<FcmJobData>): Promise<{ sent: number; failed: number }> {
    const { userId, title, body, data } = job.data

    const tokens = await this.prisma.$queryRaw<FcmTokenRow[]>`
      SELECT id, token FROM user_fcm_tokens
      WHERE user_id = ${userId}::uuid AND is_stale = false
    `

    if (tokens.length === 0) return { sent: 0, failed: 0 }

    const serverKey = this.config.get<string>('FCM_SERVER_KEY')
    if (!serverKey) {
      this.logger.warn('FCM_SERVER_KEY not configured; skipping push')
      return { sent: 0, failed: 0 }
    }

    let totalSent = 0
    let totalFailed = 0

    for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
      const batch = tokens.slice(i, i + FCM_BATCH_SIZE)

      try {
        const response = await fetch(this.fcmUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${serverKey}`,
          },
          body: JSON.stringify({
            registration_ids: batch.map(t => t.token),
            notification: { title, body },
            data: data ?? {},
          }),
        })

        if (!response.ok) {
          this.logger.error(`FCM HTTP ${response.status} for user ${userId}`)
          totalFailed += batch.length
          continue
        }

        const result = (await response.json()) as FcmResponse
        totalSent += result.success
        totalFailed += result.failure

        if (result.failure > 0) {
          await this.markStaleTokens(batch, result.results)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        this.logger.error(`FCM batch error for user ${userId}: ${msg}`)
        totalFailed += batch.length
      }
    }

    return { sent: totalSent, failed: totalFailed }
  }

  private async markStaleTokens(batch: FcmTokenRow[], results: FcmBatchResult[]): Promise<void> {
    const staleIds = batch
      .filter((_, i) => results[i]?.error === 'NotRegistered' || results[i]?.error === 'InvalidRegistration')
      .map(t => t.id)

    if (staleIds.length > 0) {
      await this.prisma.$executeRaw`
        UPDATE user_fcm_tokens SET is_stale = true WHERE id = ANY(${staleIds}::uuid[])
      `
      this.logger.log(`Marked ${staleIds.length} FCM tokens stale`)
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<FcmJobData>, error: Error): void {
    this.logger.error(`FCM job ${job.id} failed for user ${job.data.userId}: ${error.message}`)
  }
}
