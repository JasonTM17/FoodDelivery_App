import { Injectable, Inject, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ThrottlerStorage } from '@nestjs/throttler'
import { randomUUID } from 'crypto'
import Redis from 'ioredis'

interface ThrottlerStorageRecord {
  totalHits: number
  timeToExpire: number
  isBlocked: boolean
  timeToBlockExpire: number
  expiresAt?: number
}

interface ThrottlerStorageRedisOptions {
  allowInMemoryFallback?: boolean
}

@Injectable()
export class ThrottlerStorageRedis implements ThrottlerStorage {
  private readonly logger = new Logger(ThrottlerStorageRedis.name)
  private memoryFallback: Map<string, ThrottlerStorageRecord> = new Map()
  private readonly allowInMemoryFallback: boolean

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    options: ThrottlerStorageRedisOptions = {},
  ) {
    this.allowInMemoryFallback = options.allowInMemoryFallback ?? false
  }

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
      if (!this.allowInMemoryFallback) {
        this.logger.error('Redis unavailable and in-memory rate limiter fallback is disabled')
        throw new ServiceUnavailableException('RATE_LIMIT_REDIS_UNAVAILABLE')
      }
      if (!this.memoryFallback.has(throttlerName)) {
        this.logger.warn('Redis unavailable, using explicitly enabled in-memory rate limiter fallback')
      }
      return this.incrementMemory(key, ttl, limit, blockDuration, throttlerName)
    }

    const redisKey = `rl:${throttlerName}:${key}`
    const now = Date.now()
    const windowStart = now - ttl
    const ttlSeconds = Math.max(1, Math.ceil(ttl / 1000))

    const pipeline = this.redis.pipeline()
    pipeline.zadd(redisKey, now, `${now}:${randomUUID()}`)
    pipeline.zremrangebyscore(redisKey, 0, windowStart)
    pipeline.zcard(redisKey)
    pipeline.expire(redisKey, ttlSeconds)

    const results = await pipeline.exec()
    const totalHits = (results?.[2]?.[1] as number) ?? 0

    const blockedUntil = totalHits > limit ? now + blockDuration : undefined
    const timeToExpire = ttl

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
    const now = Date.now()
    const existing = this.memoryFallback.get(mapKey)
    const record =
      existing?.expiresAt && existing.expiresAt > now
        ? existing
        : {
            totalHits: 0,
            timeToExpire: ttl,
            isBlocked: false,
            timeToBlockExpire: 0,
            expiresAt: now + ttl,
          }

    record.totalHits++
    record.timeToExpire = Math.max((record.expiresAt ?? now) - now, 0)
    record.isBlocked = record.totalHits > limit

    if (record.isBlocked) {
      record.timeToBlockExpire = blockDuration
    } else {
      record.timeToBlockExpire = 0
    }

    this.memoryFallback.set(mapKey, record)

    // Cleanup old entries periodically
    if (this.memoryFallback.size > 10000) {
      this.memoryFallback.clear()
    }

    return record
  }
}
