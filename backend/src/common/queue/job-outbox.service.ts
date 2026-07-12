import { Injectable, Logger, OnModuleInit, Type } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { JobOutbox, Prisma } from '@prisma/client'
import { Job } from 'bullmq'
import { PrismaService } from '../../database/prisma.service'
import { QUEUE_FCM, QUEUE_SMTP, QUEUE_TWILIO } from '../../notifications/notifications.constants'
import { FcmProcessor } from '../../notifications/channels/fcm.processor'
import { SmtpProcessor } from '../../notifications/channels/smtp.processor'
import { TwilioProcessor } from '../../notifications/channels/twilio.processor'
import { DispatchProcessor } from '../../dispatch/dispatch.processor'
import { EtaRecomputeProcessor } from '../../tracking/eta-recompute.processor'
import { AutoTimeoutProcessor } from '../../orders/auto-timeout.processor'
import { RefundProcessor } from '../../payments/refund.processor'
import { CommissionSplitProcessor } from '../../payments/commission-split.processor'

type JobProcessor = { process(job: Job<unknown>): Promise<unknown> }
type JobStats = { claimed: number; completed: number; failed: number; retried: number }

const DEFAULT_DRAIN_LIMIT = 25
const MAX_DRAIN_LIMIT = 100
const PROCESSING_LEASE_MS = 5 * 60_000

@Injectable()
export class JobOutboxService implements OnModuleInit {
  private readonly logger = new Logger(JobOutboxService.name)
  private readonly processors = new Map<string, JobProcessor>()

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit(): void {
    this.registerProcessor('dispatch', DispatchProcessor)
    this.registerProcessor('tracking-eta', EtaRecomputeProcessor)
    this.registerProcessor('order-timeout', AutoTimeoutProcessor)
    this.registerProcessor('payment-refund', RefundProcessor)
    this.registerProcessor('commission-split', CommissionSplitProcessor)
    this.registerProcessor(QUEUE_FCM, FcmProcessor)
    this.registerProcessor(QUEUE_SMTP, SmtpProcessor)
    this.registerProcessor(QUEUE_TWILIO, TwilioProcessor)
  }

  async drain(limit = DEFAULT_DRAIN_LIMIT): Promise<JobStats> {
    const take = Math.max(1, Math.min(MAX_DRAIN_LIMIT, Math.trunc(limit)))
    await this.recoverStaleClaims()
    const dueJobs = await this.prisma.jobOutbox.findMany({
      where: { status: 'queued', runAt: { lte: new Date() } },
      orderBy: [{ runAt: 'asc' }, { createdAt: 'asc' }],
      take,
    })

    const stats: JobStats = { claimed: 0, completed: 0, failed: 0, retried: 0 }
    for (const job of dueJobs) {
      const claimed = await this.claim(job)
      if (!claimed) continue
      stats.claimed += 1

      try {
        await this.run(job)
        const options = parseOptions(job.options)
        await this.prisma.jobOutbox.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            error: null,
            ...(options.removeOnComplete === true ? { dedupeKey: null } : {}),
          },
        })
        stats.completed += 1
      } catch (err) {
        const retry = await this.handleFailure(job, err)
        if (retry) stats.retried += 1
        else stats.failed += 1
      }
    }

    return stats
  }

  private registerProcessor(queue: string, token: Type<unknown>): void {
    try {
      this.processors.set(queue, this.moduleRef.get(token, { strict: false }) as JobProcessor)
    } catch {
      this.logger.warn(`Queue processor ${token.name} is not available for ${queue}`)
    }
  }

  private async recoverStaleClaims(): Promise<void> {
    const recovered = await this.prisma.jobOutbox.updateMany({
      where: {
        status: 'processing',
        updatedAt: { lt: new Date(Date.now() - PROCESSING_LEASE_MS) },
      },
      data: {
        status: 'queued',
        runAt: new Date(),
        error: 'JOB_PROCESSING_LEASE_EXPIRED',
        updatedAt: new Date(),
      },
    })
    if (recovered.count > 0) {
      this.logger.warn(`Recovered ${recovered.count} stale Postgres queue claim(s)`)
    }
  }

  private async claim(job: JobOutbox): Promise<boolean> {
    const result = await this.prisma.jobOutbox.updateMany({
      where: { id: job.id, status: 'queued' },
      data: {
        status: 'processing',
        attempts: { increment: 1 },
        updatedAt: new Date(),
      },
    })
    return result.count === 1
  }

  private async run(job: JobOutbox): Promise<unknown> {
    const processor = this.processors.get(job.queue)
    if (!processor) {
      throw new Error(`No processor registered for queue ${job.queue}`)
    }

    return processor.process({
      id: job.id,
      name: job.name,
      data: job.payload,
      opts: parseOptions(job.options),
    } as unknown as Job<unknown>)
  }

  private async handleFailure(job: JobOutbox, err: unknown): Promise<boolean> {
    const options = parseOptions(job.options)
    const maxAttempts = resolveAttempts(options)
    const nextAttempt = job.attempts + 1
    const message = err instanceof Error ? err.message : String(err)

    if (nextAttempt < maxAttempts) {
      const delayMs = resolveBackoffMs(options, nextAttempt)
      await this.prisma.jobOutbox.update({
        where: { id: job.id },
        data: {
          status: 'queued',
          runAt: new Date(Date.now() + delayMs),
          error: message.slice(0, 2000),
          updatedAt: new Date(),
        },
      })
      this.logger.warn(`Job ${job.id} failed; retry ${nextAttempt + 1}/${maxAttempts} in ${delayMs}ms: ${message}`)
      return true
    }

    await this.prisma.jobOutbox.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        failedAt: new Date(),
        error: message.slice(0, 2000),
        ...(options.removeOnFail === true ? { dedupeKey: null } : {}),
      },
    })
    this.logger.error(`Job ${job.id} permanently failed after ${nextAttempt}/${maxAttempts} attempts: ${message}`)
    return false
  }
}

function parseOptions(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function resolveAttempts(options: Record<string, unknown>): number {
  const attempts = options.attempts
  if (typeof attempts !== 'number' || !Number.isFinite(attempts)) return 1
  return Math.max(1, Math.trunc(attempts))
}

function resolveBackoffMs(options: Record<string, unknown>, attempt: number): number {
  const backoff = options.backoff
  if (!backoff || typeof backoff !== 'object' || Array.isArray(backoff)) return 30_000
  const delay = (backoff as Record<string, unknown>).delay
  const type = (backoff as Record<string, unknown>).type
  const baseDelay = typeof delay === 'number' && Number.isFinite(delay) ? Math.max(0, delay) : 30_000
  if (type === 'exponential') {
    return baseDelay * 2 ** Math.max(0, attempt - 1)
  }
  return baseDelay
}
