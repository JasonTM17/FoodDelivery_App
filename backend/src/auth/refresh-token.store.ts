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
}
