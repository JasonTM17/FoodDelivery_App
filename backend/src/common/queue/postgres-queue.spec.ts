import { PrismaService } from '../../database/prisma.service'
import { PostgresQueue } from './postgres-queue'

describe('PostgresQueue', () => {
  const now = new Date('2026-07-09T10:00:00.000Z')
  const create = jest.fn()
  const findUnique = jest.fn()
  let queue: PostgresQueue<{ orderId: string }>

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now)
    create.mockResolvedValue({ id: 'job-1' })
    findUnique.mockResolvedValue({ id: 'job-1' })
    queue = new PostgresQueue(
      { jobOutbox: { create, findUnique } } as unknown as PrismaService,
      'dispatch',
    )
  })

  afterEach(() => {
    jest.useRealTimers()
    create.mockReset()
    findUnique.mockReset()
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

  it('persists BullMQ jobId as a durable queue-scoped dedupe key', async () => {
    await queue.add(
      'dispatch.driver',
      { orderId: 'order-1' },
      { jobId: 'dispatch-order-1-1', removeOnComplete: true },
    )

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        queue: 'dispatch',
        dedupeKey: 'dispatch-order-1-1',
      }),
    })
  })

  it('returns the existing Postgres job when a concurrent producer reuses jobId', async () => {
    create.mockRejectedValueOnce({ code: 'P2002' })
    findUnique.mockResolvedValueOnce({ id: 'job-existing' })

    await expect(queue.add(
      'dispatch.driver',
      { orderId: 'order-1' },
      { jobId: 'dispatch-order-1-1' },
    )).resolves.toEqual(expect.objectContaining({ id: 'job-existing' }))
    expect(findUnique).toHaveBeenCalledWith({
      where: {
        queue_dedupeKey: {
          queue: 'dispatch',
          dedupeKey: 'dispatch-order-1-1',
        },
      },
      select: { id: true },
    })
  })

  it.each(['dispatch:order-1:1', '', 'x'.repeat(201)])(
    'rejects invalid cross-provider jobId %s',
    async jobId => {
      await expect(queue.add('dispatch.driver', { orderId: 'order-1' }, { jobId }))
        .rejects.toThrow('QUEUE_JOB_ID_INVALID')
      expect(create).not.toHaveBeenCalled()
    },
  )
})
