import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RefreshTokenStore {
  private readonly PREFIX = 'rt_blocklist:'
  private readonly TTL = 7 * 24 * 3600 // 7 days in seconds

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async blocklist(jti: string): Promise<void> {
    await this.redis.setex(`${this.PREFIX}${jti}`, this.TTL, '1')
  }

  async isBlocklisted(jti: string): Promise<boolean> {
    const result = await this.redis.get(`${this.PREFIX}${jti}`)
    return result !== null
  }

  async blocklistIfNew(jti: string): Promise<boolean> {
    const key = `${this.PREFIX}${jti}`
    const result = await this.redis.setnx(key, '1')
    if (result === 1) {
      await this.redis.expire(key, this.TTL)
      return true
    }
    return false
  }

  /** Stamp user so refresh tokens issued before this time are rejected. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.redis.setex(`rt_user_revoked:${userId}`, this.TTL, String(Date.now()))
  }

  async isUserRevoked(userId: string, tokenIatSeconds?: number): Promise<boolean> {
    const raw = await this.redis.get(`rt_user_revoked:${userId}`)
    if (!raw) return false
    if (tokenIatSeconds == null) return true
    const revokedAtMs = Number(raw)
    if (!Number.isFinite(revokedAtMs)) return true
    return tokenIatSeconds * 1000 < revokedAtMs
  }
}
