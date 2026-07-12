import { RealtimePublisherService } from './realtime-publisher.service'

describe('RealtimePublisherService', () => {
  const fetchMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = fetchMock
  })

  it('publishes events through the private Supabase Broadcast API', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 202 })
    const service = new RealtimePublisherService(
      {
        get: jest.fn((key: string) => ({
          REALTIME_PROVIDER: 'supabase',
          SUPABASE_SECRET_KEY: 'sb_secret_test',
        })[key]),
        getOrThrow: jest.fn(() => 'https://foodflow.supabase.co/'),
      } as never,
    )

    await expect(service.publish('private:admin:orders', 'admin:new_order', { orderId: 'order-1' }))
      .resolves.toEqual({ provider: 'supabase', queued: true })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://foodflow.supabase.co/realtime/v1/api/broadcast/private%3Aadmin%3Aorders/events/admin%3Anew_order?private=true',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ apikey: 'sb_secret_test' }),
        body: JSON.stringify({ orderId: 'order-1' }),
      }),
    )
  })

  it('fails closed when Supabase rejects the broadcast', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 })
    const service = new RealtimePublisherService({
      get: jest.fn((key: string) => ({ REALTIME_PROVIDER: 'supabase', SUPABASE_SECRET_KEY: 'bad' })[key]),
      getOrThrow: jest.fn(() => 'https://foodflow.supabase.co'),
    } as never)

    await expect(service.publish('private:admin:orders', 'admin:new_order', {}))
      .rejects.toThrow('HTTP 401')
  })

  it('does not write an outbox row while local Socket.IO realtime is active', async () => {
    const service = new RealtimePublisherService(
      { get: jest.fn((key: string) => key === 'REALTIME_PROVIDER' ? 'socketio' : undefined) } as never,
    )

    await expect(service.publish('private:admin:orders', 'admin:new_order', { orderId: 'order-1' }))
      .resolves.toEqual({ provider: 'socketio', queued: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
