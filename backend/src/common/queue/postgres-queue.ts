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
    const row = await this.prisma.jobOutbox.create({
      data: {
        queue: this.queueName,
        name,
        payload: toInputJson(data),
        options: options ? toInputJson(options) : undefined,
        runAt: resolveRunAt(options),
      },
    })

    return {
      id: row.id,
      name,
      data,
      opts: options,
    }
  }
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
