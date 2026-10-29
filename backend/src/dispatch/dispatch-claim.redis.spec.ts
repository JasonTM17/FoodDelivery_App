import Redis from 'ioredis'
import { randomUUID } from 'node:crypto'
import { DispatchOfferService } from './dispatch-offer.service'

const integration = process.env.DISPATCH_TEST_REDIS_URL ? describe : describe.skip
integration('real Redis dispatch claim compatibility', () => {
  let redis: Redis
  const driver = `synthetic-claim-${randomUUID()}`
  const keys = [`driver:${driver}:status`, `driver:${driver}:current_order`, `driver:${driver}:idle_since`]
  let claim: (driverId: string, orderId: string) => Promise<boolean>
  beforeAll(() => {
    redis = new Redis(process.env.DISPATCH_TEST_REDIS_URL!)
    const service = new DispatchOfferService(undefined as never, redis, undefined as never, undefined as never, undefined as never, undefined as never, undefined as never)
    claim = (service as unknown as { claimDriverAssignment: typeof claim }).claimDriverAssignment.bind(service)
  })
  afterEach(async () => { await redis.del(...keys) })
  afterAll(async () => { await redis.quit() })
  it('accepts the empty current-order marker produced by go-online, then rejects a competing order', async () => {
    await redis.mset(keys[0], 'online', keys[1], '')
    expect(await claim(driver, 'synthetic-order-a')).toBe(true)
    expect(await redis.get(keys[0])).toBe('busy')
    expect(await redis.get(keys[1])).toBe('synthetic-order-a')
    expect(await claim(driver, 'synthetic-order-b')).toBe(false)
    expect(await claim(driver, 'synthetic-order-a')).toBe(true)
  })
  it('does not replace a non-empty assignment or claim an offline driver', async () => {
    await redis.mset(keys[0], 'online', keys[1], 'existing-order')
    expect(await claim(driver, 'synthetic-order-b')).toBe(false)
    await redis.mset(keys[0], 'offline', keys[1], '')
    expect(await claim(driver, 'synthetic-order-b')).toBe(false)
  })
  it('allows exactly one of two concurrent competing claims', async () => {
    await redis.mset(keys[0], 'online', keys[1], '')
    const results = await Promise.all([claim(driver, 'synthetic-order-a'), claim(driver, 'synthetic-order-b')])
    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await redis.get(keys[1])).toBe(results[0] ? 'synthetic-order-a' : 'synthetic-order-b')
  })
})
