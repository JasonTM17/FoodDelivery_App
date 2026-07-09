import { PrismaService } from '../../database/prisma.service'
import { PostgresQueue } from './postgres-queue'

describe('PostgresQueue', () => {
  const now = new Date('2026-07-09T10:00:00.000Z')
  const create = jest.fn()
  let queue: PostgresQueue<{ orderId: string }>

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now)
    create.mockResolvedValue({ id: 'job-1' })
    queue = new PostgresQueue(
      { jobOutbox: { create } } as unknown as PrismaService,
      'dispatch',
    )
  })

  afterEach(() => {
    jest.useRealTimers()
    create.mockReset()
  })

  it('persists queued jobs to the Supabase/Postgres outbox', async () => {
    const result = await queue.add('dispatch.driver', { orderId: 'order-1' }, { attempts: 3 })

    expect(result).toEqual({
      id: 'job-1',
      name: 'dispatch.driver',
      data: { orderId: 'order-1' },
      opts: { attempts: 3 },
    })
    expect(create).toHaveBeenCalledWith({
      data: {
        queue: 'dispatch',
        name: 'dispatch.driver',
        payload: { orderId: 'order-1' },
        options: { attempts: 3 },
        runAt: now,
      },
    })
  })

  it('maps BullMQ delay options onto runAt', async () => {
    await queue.add('dispatch.driver', { orderId: 'order-1' }, { delay: 30_000 })

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        runAt: new Date('2026-07-09T10:00:30.000Z'),
      }),
    })
  })
})
