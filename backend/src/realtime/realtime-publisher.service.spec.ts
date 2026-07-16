import { RealtimePublisherService } from './realtime-publisher.service'
import { generateKeyPairSync } from 'node:crypto'
import { verify } from 'jsonwebtoken'

describe('RealtimePublisherService', () => {
  const fetchMock = jest.fn()
  const observeBroadcast = jest.fn()
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()

  function supabaseConfig(publishTimeoutMs?: number) {
    return {
      get: jest.fn((key: string) => {
        if (key === 'REALTIME_PROVIDER') return 'supabase'
        if (key === 'SUPABASE_REALTIME_PUBLISH_TIMEOUT_MS') return publishTimeoutMs
        return undefined
      }),
      getOrThrow: jest.fn((key: string) => ({
        SUPABASE_URL: 'https://foodflow.supabase.co/',
        SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
        SUPABASE_REALTIME_JWT_PRIVATE_KEY: privatePem,
        SUPABASE_REALTIME_JWT_KEY_ID: 'foodflow-test-es256',
      })[key]),
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = fetchMock
  })

  it('publishes events through the private Supabase Broadcast API', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 202 })
    const service = new RealtimePublisherService(
      supabaseConfig() as never,
      { observeBroadcast } as never,
    )

    await expect(service.publish('private:admin:orders', 'admin:new_order', { orderId: 'order-1' }))
      .resolves.toEqual({ provider: 'supabase', queued: true })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://foodflow.supabase.co/realtime/v1/api/broadcast/private%3Aadmin%3Aorders/events/admin%3Anew_order?private=true',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: 'sb_publishable_test',
          Authorization: expect.stringMatching(/^Bearer /),
        }),
        body: JSON.stringify({ orderId: 'order-1' }),
      }),
    )

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    const token = headers.Authorization.replace(/^Bearer /, '')
    const payload = verify(token, publicKey, { algorithms: ['ES256'] }) as {
      iss: string;
      role: string;
      iat: number;
      exp: number;
    }
    expect(payload).toMatchObject({
      iss: 'https://foodflow.supabase.co/auth/v1',
      role: 'service_role',
    })
    expect(payload.exp - payload.iat).toBe(60)
    expect(observeBroadcast).toHaveBeenCalledWith(expect.any(Number), 'success')
  })

  it('fails closed when Supabase rejects the broadcast', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 })
    const service = new RealtimePublisherService(
      supabaseConfig() as never,
      { observeBroadcast } as never,
    )

    await expect(service.publish('private:admin:orders', 'admin:new_order', {}))
      .rejects.toThrow('HTTP 401')
    expect(observeBroadcast).toHaveBeenCalledWith(expect.any(Number), 'failure')
  })

  it('contains Broadcast failures for fire-and-forget callers', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 })
    const service = new RealtimePublisherService(
      supabaseConfig() as never,
      { observeBroadcast } as never,
    )

    await expect(service.publishBestEffort('private:admin:orders', 'admin:new_order', {}))
      .resolves.toEqual({ provider: 'supabase', queued: false })
    expect(observeBroadcast).toHaveBeenCalledWith(expect.any(Number), 'failure')
  })

  it('aborts a Broadcast request that exceeds the configured timeout', async () => {
    jest.useFakeTimers()
    try {
      fetchMock.mockImplementationOnce((_input: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener(
            'abort',
            () => reject(new Error('request aborted')),
            { once: true },
          )
        }))
      const service = new RealtimePublisherService(
        supabaseConfig(100) as never,
        { observeBroadcast } as never,
      )

      const rejection = expect(
        service.publish('private:admin:orders', 'admin:new_order', {}),
      ).rejects.toThrow('request aborted')
      await jest.advanceTimersByTimeAsync(100)

      await rejection
      expect(observeBroadcast).toHaveBeenCalledWith(expect.any(Number), 'failure')
    } finally {
      jest.useRealTimers()
    }
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
