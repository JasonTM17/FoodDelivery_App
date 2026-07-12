import { ConfigService } from '@nestjs/config'
import { JobOutboxService } from '../common/queue/job-outbox.service'
import { PostgresJobOutboxWorkerService } from './postgres-job-outbox-worker.service'

describe('PostgresJobOutboxWorkerService', () => {
  const emptyDrain = { claimed: 0, completed: 0, failed: 0, retried: 0 }
  let drain: jest.Mock
  let get: jest.Mock
  let service: PostgresJobOutboxWorkerService

  beforeEach(() => {
    jest.useFakeTimers()
    drain = jest.fn().mockResolvedValue(emptyDrain)
    get = jest.fn((key: string, fallback?: unknown) => {
      const values: Record<string, unknown> = {
        QUEUE_PROVIDER: 'supabase-postgres',
        JOB_OUTBOX_DRAIN_LIMIT: 2,
        JOB_OUTBOX_POLL_INTERVAL_MS: 100,
      }
      return values[key] ?? fallback
    })
    service = new PostgresJobOutboxWorkerService(
      { get } as unknown as ConfigService,
      { drain } as unknown as JobOutboxService,
    )
  })

  afterEach(async () => {
    await service.onApplicationShutdown()
    jest.useRealTimers()
  })

  it('drains immediately and then polls while the Supabase Postgres provider is selected', async () => {
    service.onModuleInit()
    await flushAsyncWork()
    expect(drain).toHaveBeenCalledWith(2)

    await jest.advanceTimersByTimeAsync(100)
    expect(drain).toHaveBeenCalledTimes(2)
  })

  it('keeps draining batches until the queue is caught up', async () => {
    drain
      .mockResolvedValueOnce({ claimed: 2, completed: 2, failed: 0, retried: 0 })
      .mockResolvedValueOnce(emptyDrain)

    service.onModuleInit()
    await flushAsyncWork()

    expect(drain).toHaveBeenCalledTimes(2)
  })

  it('does not start a Postgres polling loop for the BullMQ compatibility provider', async () => {
    get.mockImplementation((key: string, fallback?: unknown) => (
      key === 'QUEUE_PROVIDER' ? 'bullmq' : fallback
    ))

    service.onModuleInit()
    await jest.advanceTimersByTimeAsync(500)

    expect(drain).not.toHaveBeenCalled()
  })
})

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}
