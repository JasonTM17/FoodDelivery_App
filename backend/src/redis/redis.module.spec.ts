import type Redis from 'ioredis'
import { RedisLifecycleService } from './redis.module'

describe('RedisLifecycleService', () => {
  const createRedis = (status: string) => ({
    status,
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
  }) as unknown as Redis

  it('gracefully closes an active Redis connection', async () => {
    const redis = createRedis('ready')
    const service = new RedisLifecycleService(redis)

    await service.onApplicationShutdown()

    expect(redis.quit).toHaveBeenCalledTimes(1)
    expect(redis.disconnect).not.toHaveBeenCalled()
  })

  it('does nothing when Redis is already closed', async () => {
    const redis = createRedis('end')
    const service = new RedisLifecycleService(redis)

    await service.onApplicationShutdown()

    expect(redis.quit).not.toHaveBeenCalled()
    expect(redis.disconnect).not.toHaveBeenCalled()
  })

  it('force-closes Redis if graceful shutdown fails', async () => {
    const redis = createRedis('ready')
    jest.mocked(redis.quit).mockRejectedValueOnce(new Error('connection lost'))
    const service = new RedisLifecycleService(redis)

    await service.onApplicationShutdown()

    expect(redis.disconnect).toHaveBeenCalledWith(false)
  })

  it('bounds graceful shutdown when Redis never answers', async () => {
    jest.useFakeTimers()
    try {
      const redis = createRedis('ready')
      jest.mocked(redis.quit).mockImplementationOnce(() => new Promise(() => {}))
      const service = new RedisLifecycleService(redis)

      const shutdown = service.onApplicationShutdown()
      await jest.advanceTimersByTimeAsync(3_000)
      await shutdown

      expect(redis.disconnect).toHaveBeenCalledWith(false)
    } finally {
      jest.useRealTimers()
    }
  })
})
