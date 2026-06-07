import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'

const WINDOW_MS = 15 * 60 * 1000      // 15-minute sliding window
const COOLDOWN_MS = 5 * 60 * 1000     // 5-minute cooldown period
const TIMEOUT_THRESHOLD = 3           // timeouts in window before cooldown
const PRUNE_AGE_MS = 24 * 60 * 60 * 1000  // entries older than 24h

function zsetKey(driverId: string): string {
  return `cooldown:driver:${driverId}`
}

@Injectable()
export class CooldownService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Record a dispatch timeout for a driver.
   * Uses the current timestamp as both score and member for ZSET uniqueness.
   */
  async recordTimeout(driverId: string): Promise<void> {
    const key = zsetKey(driverId)
    const now = Date.now()
    // member = timestamp string ensures unique entry per timeout event
    await this.redis.zadd(key, now, `${now}`)
    await this.redis.pexpire(key, PRUNE_AGE_MS)
  }

  /**
   * Returns true if the driver should be excluded from dispatch due to
   * too many recent timeouts (>= 3 in last 15 min, latest within 5 min).
   */
  async isInCooldown(driverId: string): Promise<boolean> {
    const key = zsetKey(driverId)
    const now = Date.now()

    const recentCount = await this.redis.zcount(key, now - WINDOW_MS, '+inf')
    if (recentCount < TIMEOUT_THRESHOLD) return false

    // Verify the threshold was hit recently (within the cooldown window)
    const latest = await this.redis.zrange(key, -1, -1, 'WITHSCORES')
    if (!latest.length) return false

    // zrange WITHSCORES returns [member, score, ...]
    const latestScore = parseInt(latest[1] ?? latest[0], 10)
    return latestScore > now - COOLDOWN_MS
  }

  /**
   * Remove entries older than 24h for a specific driver.
   * Called by daily pruning job.
   */
  async pruneDriver(driverId: string): Promise<void> {
    const key = zsetKey(driverId)
    await this.redis.zremrangebyscore(key, '-inf', Date.now() - PRUNE_AGE_MS)
  }

  /**
   * Scan and prune all cooldown keys. Intended for daily batch job.
   */
  async pruneAll(): Promise<void> {
    const cutoff = Date.now() - PRUNE_AGE_MS
    let cursor = '0'
    do {
      const [next, keys] = await this.redis.scan(cursor, 'MATCH', 'cooldown:driver:*', 'COUNT', 100)
      cursor = next
      await Promise.all(keys.map(key => this.redis.zremrangebyscore(key, '-inf', cutoff)))
    } while (cursor !== '0')
  }
}
