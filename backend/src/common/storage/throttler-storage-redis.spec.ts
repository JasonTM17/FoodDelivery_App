import Redis from 'ioredis'
import { ThrottlerStorageRedis } from './throttler-storage-redis'

describe('ThrottlerStorageRedis', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('uses millisecond ttl for the rolling window and second ttl for Redis expiry', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)

    const pipeline = {
      zadd: jest.fn().mockReturnThis(),
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 1], [null, 1], [null, 6], [null, 1]]),
    }
    const redis = {
      ping: jest.fn().mockResolvedValue('PONG'),
      pipeline: jest.fn(() => pipeline),
    } as unknown as Redis

    const storage = new ThrottlerStorageRedis(redis)
    const result = await storage.increment('::1', 60_000, 5, 60_000, 'default')

    expect(pipeline.zremrangebyscore).toHaveBeenCalledWith('rl:default:::1', 0, 1_699_999_940_000)
    expect(pipeline.expire).toHaveBeenCalledWith('rl:default:::1', 60)
    expect(result).toMatchObject({
      totalHits: 6,
      timeToExpire: 60_000,
      isBlocked: true,
      timeToBlockExpire: 60_000,
    })
  })

  it('resets the in-memory fallback counter after the ttl window expires', async () => {
    const redis = { ping: jest.fn().mockRejectedValue(new Error('offline')) } as unknown as Redis
    const storage = new ThrottlerStorageRedis(redis, { allowInMemoryFallback: true })
    const nowSpy = jest.spyOn(Date, 'now')

    nowSpy.mockReturnValue(1_000)
    expect(await storage.increment('::1', 1_000, 1, 1_000, 'default')).toMatchObject({
      totalHits: 1,
      isBlocked: false,
    })

    nowSpy.mockReturnValue(1_500)
    expect(await storage.increment('::1', 1_000, 1, 1_000, 'default')).toMatchObject({
      totalHits: 2,
      isBlocked: true,
    })

    nowSpy.mockReturnValue(2_001)
    expect(await storage.increment('::1', 1_000, 1, 1_000, 'default')).toMatchObject({
      totalHits: 1,
      isBlocked: false,
    })
  })

  it('fails closed by default when Redis is unavailable', async () => {
    const redis = { ping: jest.fn().mockRejectedValue(new Error('offline')) } as unknown as Redis
    const storage = new ThrottlerStorageRedis(redis)

    await expect(storage.increment('::1', 1_000, 1, 1_000, 'default')).rejects.toThrow(
      'RATE_LIMIT_REDIS_UNAVAILABLE',
    )
  })
})
