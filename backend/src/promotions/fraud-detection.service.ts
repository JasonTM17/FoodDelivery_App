import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'
import { FraudCheckResult } from './promotions.types'

const WINDOW_SECONDS = 3600
const MAX_CLAIMS_PER_HOUR = 3

@Injectable()
export class FraudDetectionService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async check(fingerprint: string): Promise<FraudCheckResult> {
    const key = `promo:device:${fingerprint}`
    const now = Date.now()
    const windowStart = now - WINDOW_SECONDS * 1000

    // Remove entries outside the 1-hour sliding window
    await this.redis.zremrangebyscore(key, '-inf', windowStart)
    const count = await this.redis.zcard(key)

    if (count >= MAX_CLAIMS_PER_HOUR) {
      return {
        blocked: true,
        reason: `Thiết bị đã sử dụng quá ${MAX_CLAIMS_PER_HOUR} mã khuyến mãi trong 1 giờ`,
      }
    }

    return { blocked: false, reason: '' }
  }

  async record(fingerprint: string): Promise<void> {
    const key = `promo:device:${fingerprint}`
    const now = Date.now()
    // Unique member: timestamp + random suffix to allow multiple entries per ms
    await this.redis.zadd(key, now, `${now}-${Math.random().toString(36).slice(2)}`)
    await this.redis.expire(key, WINDOW_SECONDS)
  }
}
