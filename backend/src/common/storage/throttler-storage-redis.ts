import { Injectable, Inject, Logger } from '@nestjs/common'
import { ThrottlerStorage } from '@nestjs/throttler'
import { randomUUID } from 'crypto'
import Redis from 'ioredis'

interface ThrottlerStorageRecord {
  totalHits: number
  timeToExpire: number
  isBlocked: boolean
  timeToBlockExpire: number
}

@Injectable()
export class ThrottlerStorageRedis implements ThrottlerStorage {
  private readonly logger = new Logger(ThrottlerStorageRedis.name)
  private memoryFallback: Map<string, ThrottlerStorageRecord> = new Map()

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private async isRedisAvailable(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch {
      return false
    }
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisAvailable = await this.isRedisAvailable()

    if (!redisAvailable) {
      if (!this.memoryFallback.has(throttlerName)) {
        this.logger.warn('Redis unavailable, using in-memory rate limiter fallback')
      }
      return this.incrementMemory(key, ttl, limit, blockDuration, throttlerName)
    }

    const redisKey = `rl:${throttlerName}:${key}`
    const now = Date.now()
    const windowStart = now - ttl * 1000

    const pipeline = this.redis.pipeline()
    pipeline.zadd(redisKey, now, `${now}:${randomUUID()}`)
    pipeline.zremrangebyscore(redisKey, 0, windowStart)
    pipeline.zcard(redisKey)
    pipeline.expire(redisKey, ttl)

    const results = await pipeline.exec()
    const totalHits = (results?.[2]?.[1] as number) ?? 0

    const blockedUntil = totalHits > limit ? now + blockDuration * 1000 : undefined
    const timeToExpire = ttl * 1000

    return {
      totalHits,
      timeToExpire,
      isBlocked: totalHits > limit,
      timeToBlockExpire: blockedUntil ? blockedUntil - now : 0,
    }
  }

  private incrementMemory(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): ThrottlerStorageRecord {
    const mapKey = `${throttlerName}:${key}`
    const record = this.memoryFallback.get(mapKey) ?? { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 }

    record.totalHits++
    record.timeToExpire = ttl * 1000
    record.isBlocked = record.totalHits > limit

    if (record.isBlocked) {
      record.timeToBlockExpire = blockDuration * 1000
    }

    this.memoryFallback.set(mapKey, record)

    // Cleanup old entries periodically
    if (this.memoryFallback.size > 10000) {
      this.memoryFallback.clear()
    }

    return record
  }
}
