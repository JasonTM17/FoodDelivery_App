import { ModuleRef } from '@nestjs/core'
import { JobOutbox } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { JobOutboxService } from './job-outbox.service'

describe('JobOutboxService', () => {
  const now = new Date('2026-07-09T10:00:00.000Z')
  const process = jest.fn()
  const findMany = jest.fn()
  const updateMany = jest.fn()
  const update = jest.fn()
  let service: JobOutboxService

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now)
    process.mockResolvedValue(undefined)
    findMany.mockResolvedValue([makeJob()])
    updateMany.mockResolvedValue({ count: 1 })
    update.mockResolvedValue(makeJob())

    const prisma = {
      jobOutbox: {
        findMany,
        updateMany,
        update,
      },
    } as unknown as PrismaService
    const moduleRef = {
      get: jest.fn(() => ({ process })),
    } as unknown as ModuleRef

    service = new JobOutboxService(prisma, moduleRef)
    service.onModuleInit()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  it('claims due jobs, runs the mapped processor, and completes them', async () => {
    await expect(service.drain(10)).resolves.toEqual({
      claimed: 1,
      completed: 1,
      failed: 0,
      retried: 0,
    })

    expect(findMany).toHaveBeenCalledWith({
      where: { status: 'queued', runAt: { lte: now } },
      orderBy: [{ runAt: 'asc' }, { createdAt: 'asc' }],
      take: 10,
    })
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'job-1', status: 'queued' },
      data: {
        status: 'processing',
        attempts: { increment: 1 },
        updatedAt: now,
      },
    })
    expect(process).toHaveBeenCalledWith(expect.objectContaining({
      id: 'job-1',
      name: 'dispatch.driver',
      data: { orderId: 'order-1' },
      opts: expect.objectContaining({ attempts: 2 }),
    }))
    expect(update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: {
        status: 'completed',
        completedAt: now,
        error: null,
      },
    })
  })

  it('requeues failed jobs when attempts remain', async () => {
    process.mockRejectedValueOnce(new Error('temporary outage'))

    await expect(service.drain()).resolves.toEqual({
      claimed: 1,
      completed: 0,
      failed: 0,
      retried: 1,
    })

    expect(update).toHaveBeenLastCalledWith({
      where: { id: 'job-1' },
      data: {
        status: 'queued',
        runAt: new Date('2026-07-09T10:00:05.000Z'),
        error: 'temporary outage',
        updatedAt: now,
      },
    })
  })

  it('marks failed jobs terminal when max attempts are exhausted', async () => {
    process.mockRejectedValueOnce(new Error('bad payload'))
    findMany.mockResolvedValueOnce([makeJob({ options: { attempts: 1 } })])

    await expect(service.drain()).resolves.toEqual({
      claimed: 1,
      completed: 0,
      failed: 1,
      retried: 0,
    })

    expect(update).toHaveBeenLastCalledWith({
      where: { id: 'job-1' },
      data: {
        status: 'failed',
        failedAt: now,
        error: 'bad payload',
      },
    })
  })
})

function makeJob(overrides: Partial<JobOutbox> = {}): JobOutbox {
  return {
    id: 'job-1',
    queue: 'dispatch',
    name: 'dispatch.driver',
    payload: { orderId: 'order-1' },
    options: { attempts: 2, backoff: { type: 'fixed', delay: 5000 } },
    status: 'queued',
    attempts: 0,
    runAt: new Date('2026-07-09T09:59:00.000Z'),
    createdAt: new Date('2026-07-09T09:58:00.000Z'),
    updatedAt: new Date('2026-07-09T09:58:00.000Z'),
    completedAt: null,
    failedAt: null,
    error: null,
    ...overrides,
  }
}
