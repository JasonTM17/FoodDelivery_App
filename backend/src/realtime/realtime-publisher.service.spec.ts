import { RealtimePublisherService } from './realtime-publisher.service'

describe('RealtimePublisherService', () => {
  const prisma = {
    realtimeOutbox: { create: jest.fn() },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('writes Supabase realtime events to the persisted outbox', async () => {
    prisma.realtimeOutbox.create.mockResolvedValueOnce({ id: 'outbox-1' })
    const service = new RealtimePublisherService(
      { get: jest.fn((key: string) => key === 'REALTIME_PROVIDER' ? 'supabase' : undefined) } as never,
      prisma as never,
    )

    await expect(service.publish('private:admin:orders', 'admin:new_order', { orderId: 'order-1' }))
      .resolves.toEqual({ provider: 'supabase', queued: true })
    expect(prisma.realtimeOutbox.create).toHaveBeenCalledWith({
      data: {
        channel: 'private:admin:orders',
        event: 'admin:new_order',
        payload: { orderId: 'order-1' },
      },
    })
  })

  it('does not write an outbox row while local Socket.IO realtime is active', async () => {
    const service = new RealtimePublisherService(
      { get: jest.fn((key: string) => key === 'REALTIME_PROVIDER' ? 'socketio' : undefined) } as never,
      prisma as never,
    )

    await expect(service.publish('private:admin:orders', 'admin:new_order', { orderId: 'order-1' }))
      .resolves.toEqual({ provider: 'socketio', queued: false })
    expect(prisma.realtimeOutbox.create).not.toHaveBeenCalled()
  })
})
