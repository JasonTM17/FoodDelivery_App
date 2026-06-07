import { Injectable, Inject, Optional } from '@nestjs/common'
import { I18nService, I18nContext } from 'nestjs-i18n'
import Redis from 'ioredis'
import { FraudCheckResult } from './promotions.types'
import { fallbackT } from '../i18n/fallback-translations'

const WINDOW_SECONDS = 3600
const MAX_CLAIMS_PER_HOUR = 3

@Injectable()
export class FraudDetectionService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Optional() private readonly i18n?: I18nService,
  ) {}

  private t(key: string, args?: Record<string, unknown>): string {
    if (!this.i18n) return fallbackT(key, args)
    return this.i18n.t(key, { lang: I18nContext.current()?.lang ?? 'vi', args })
  }

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
        reason: this.t('errors.promotion_device_blocked', { max: MAX_CLAIMS_PER_HOUR }),
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
