import { of } from 'rxjs'
import { IdempotencyInterceptor } from './idempotency.interceptor'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

function makeContext(opts: {
  method?: string
  headers?: Record<string, string>
  user?: Record<string, string>
  ip?: string
}) {
  const req: Record<string, unknown> = {
    method: opts.method ?? 'POST',
    headers: opts.headers ?? {},
    ip: opts.ip ?? '127.0.0.1',
  }
  if (opts.user) req.user = opts.user
  const res = { status: jest.fn().mockReturnThis() }
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    _res: res,
  }
}

function makeNext(returnValue: unknown = { ok: true }) {
  return { handle: jest.fn(() => of(returnValue)) }
}

describe('IdempotencyInterceptor', () => {
  let redis: { get: jest.Mock; set: jest.Mock }
  let interceptor: IdempotencyInterceptor

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    }
    interceptor = new IdempotencyInterceptor(redis as never)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('passes through GET without touching Redis', async () => {
    const ctx = makeContext({ method: 'GET' })
    const next = makeNext()
    await interceptor.intercept(ctx as never, next)
    expect(next.handle).toHaveBeenCalled()
    expect(redis.get).not.toHaveBeenCalled()
  })

  it('passes through DELETE without touching Redis', async () => {
    const ctx = makeContext({ method: 'DELETE' })
    const next = makeNext()
    await interceptor.intercept(ctx as never, next)
    expect(next.handle).toHaveBeenCalled()
    expect(redis.get).not.toHaveBeenCalled()
  })

  it('passes through POST with no idempotency-key header', async () => {
    const ctx = makeContext({ method: 'POST', headers: {} })
    const next = makeNext()
    await interceptor.intercept(ctx as never, next)
    expect(next.handle).toHaveBeenCalled()
    expect(redis.get).not.toHaveBeenCalled()
  })

  it('passes through (uncached) for invalid UUID key format', async () => {
    const ctx = makeContext({ method: 'POST', headers: { 'x-idempotency-key': 'not-a-uuid' } })
    const next = makeNext()
    await interceptor.intercept(ctx as never, next)
    expect(next.handle).toHaveBeenCalled()
    expect(redis.get).not.toHaveBeenCalled()
  })

  it('calls next and caches response for new valid key', async () => {
    const ctx = makeContext({ method: 'POST', headers: { 'x-idempotency-key': VALID_UUID } })
    const next = makeNext({ id: 1 })
    const obs$ = await interceptor.intercept(ctx as never, next)
    await new Promise<void>((resolve) => obs$!.subscribe({ next: () => resolve() }))
    expect(next.handle).toHaveBeenCalled()
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining(VALID_UUID),
      expect.any(String),
      'EX',
      300,
    )
  })

  it('returns cached body on duplicate key without calling next', async () => {
    const cached = JSON.stringify({ status: 200, body: { order: 'exists' } })
    redis.get.mockResolvedValue(cached)
    const ctx = makeContext({ method: 'POST', headers: { 'x-idempotency-key': VALID_UUID } })
    const next = makeNext()
    const obs$ = await interceptor.intercept(ctx as never, next)
    const values: unknown[] = []
    await new Promise<void>((resolve) => obs$!.subscribe({ next: (v) => { values.push(v); resolve() } }))
    expect(next.handle).not.toHaveBeenCalled()
    expect(values[0]).toEqual({ order: 'exists' })
  })

  it('sets response status from cached entry', async () => {
    const cached = JSON.stringify({ status: 201, body: {} })
    redis.get.mockResolvedValue(cached)
    const ctx = makeContext({ method: 'POST', headers: { 'x-idempotency-key': VALID_UUID } })
    await interceptor.intercept(ctx as never, makeNext())
    expect(ctx._res.status).toHaveBeenCalledWith(201)
  })

  it('uses userId from authenticated request in Redis key', async () => {
    const ctx = makeContext({
      method: 'POST',
      headers: { 'x-idempotency-key': VALID_UUID },
      user: { sub: 'user-abc' },
    })
    await interceptor.intercept(ctx as never, makeNext())
    expect(redis.get).toHaveBeenCalledWith(expect.stringContaining('user-abc'))
  })

  it('falls back to IP when request is unauthenticated', async () => {
    const ctx = makeContext({
      method: 'POST',
      headers: { 'x-idempotency-key': VALID_UUID },
      ip: '10.0.0.1',
    })
    await interceptor.intercept(ctx as never, makeNext())
    expect(redis.get).toHaveBeenCalledWith(expect.stringContaining('10.0.0.1'))
  })

  it('still calls next when Redis read throws', async () => {
    redis.get.mockRejectedValue(new Error('Redis unavailable'))
    const ctx = makeContext({ method: 'POST', headers: { 'x-idempotency-key': VALID_UUID } })
    const next = makeNext()
    const obs$ = await interceptor.intercept(ctx as never, next)
    expect(next.handle).toHaveBeenCalled()
    expect(obs$).toBeDefined()
  })

  it('works for PATCH method as well', async () => {
    const ctx = makeContext({ method: 'PATCH', headers: { 'x-idempotency-key': VALID_UUID } })
    const next = makeNext()
    const obs$ = await interceptor.intercept(ctx as never, next)
    await new Promise<void>((resolve) => obs$!.subscribe({ next: () => resolve() }))
    expect(next.handle).toHaveBeenCalled()
    expect(redis.set).toHaveBeenCalled()
  })
})
