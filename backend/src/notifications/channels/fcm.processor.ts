import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger, Inject } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { QUEUE_FCM, FCM_BATCH_SIZE } from '../notifications.constants'
import { FcmJobData } from './fcm.channel'
import type { Message, SendResponse } from 'firebase-admin/messaging'
import {
  FCM_MESSAGING_CLIENT,
  type FirebaseMessagingClient,
} from './firebase-admin-messaging.client'

interface FcmTokenRow {
  id: string
  token: string
}

@Processor(QUEUE_FCM)
export class FcmProcessor extends WorkerHost {
  private readonly logger = new Logger(FcmProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(FCM_MESSAGING_CLIENT) private readonly messaging: FirebaseMessagingClient,
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

    let totalSent = 0
    let totalFailed = 0

    for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
      const batch = tokens.slice(i, i + FCM_BATCH_SIZE)

      let result
      try {
        result = await this.messaging.sendEach(this.toMessages(batch, title, body, data))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        this.logger.error(`FCM provider request failed for user ${userId}: ${msg}`)
        // A rejected request has no reliable delivery result, so the queue must retry it.
        throw err
      }

      totalSent += result.successCount
      totalFailed += result.failureCount
      if (result.failureCount > 0) {
        try {
          await this.markStaleTokens(batch, result.responses)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          this.logger.error(`FCM stale-token cleanup failed for user ${userId}: ${msg}`)
        }
      }
    }

    return { sent: totalSent, failed: totalFailed }
  }

  private toMessages(
    batch: FcmTokenRow[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Message[] {
    const fcmData = toFcmData(data)
    return batch.map(({ token }) => ({
      token,
      notification: { title, body },
      ...(fcmData ? { data: fcmData } : {}),
    }))
  }

  private async markStaleTokens(batch: FcmTokenRow[], results: SendResponse[]): Promise<void> {
    const staleIds = batch
      .filter((_, i) => isPermanentlyInvalidToken(results[i]?.error?.code))
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

function toFcmData(data?: Record<string, unknown>): Record<string, string> | undefined {
  if (!data) return undefined

  const entries = Object.entries(data)
    .map(([key, value]) => [key, serializeFcmDataValue(value)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined)

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function serializeFcmDataValue(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

function isPermanentlyInvalidToken(code?: string): boolean {
  return code === 'messaging/registration-token-not-registered'
    || code === 'messaging/invalid-registration-token'
}
