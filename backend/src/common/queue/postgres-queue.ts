import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

export type PostgresQueueOptions = Record<string, unknown>

export interface PostgresQueuedJob<T = unknown> {
  id: string
  name: string
  data: T
  opts?: PostgresQueueOptions
}

export class PostgresQueue<T = unknown> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueName: string,
  ) {}

  async add(name: string, data: T, options?: PostgresQueueOptions): Promise<PostgresQueuedJob<T>> {
    const dedupeKey = resolveDedupeKey(options)
    let row: { id: string }
    try {
      row = await this.prisma.jobOutbox.create({
        data: {
          queue: this.queueName,
          ...(dedupeKey ? { dedupeKey } : {}),
          name,
          payload: toInputJson(data),
          options: options ? toInputJson(options) : undefined,
          runAt: resolveRunAt(options),
        },
      })
    } catch (error) {
      if (!dedupeKey || !isUniqueConstraintError(error)) throw error
      const existing = await this.prisma.jobOutbox.findUnique({
        where: {
          queue_dedupeKey: {
            queue: this.queueName,
            dedupeKey,
          },
        },
        select: { id: true },
      })
      if (!existing) throw error
      row = existing
    }

    return {
      id: row.id,
      name,
      data,
      opts: options,
    }
  }
}

function resolveDedupeKey(options?: PostgresQueueOptions): string | undefined {
  const jobId = options?.jobId
  if (jobId === undefined) return undefined
  if (typeof jobId !== 'string' || jobId.length === 0 || jobId.length > 200 || jobId.includes(':')) {
    throw new Error('QUEUE_JOB_ID_INVALID')
  }
  return jobId
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: unknown }).code === 'P2002'
}

function resolveRunAt(options?: PostgresQueueOptions): Date {
  const delay = options?.delay
  if (typeof delay === 'number' && Number.isFinite(delay) && delay > 0) {
    return new Date(Date.now() + delay)
  }

  return new Date()
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}
