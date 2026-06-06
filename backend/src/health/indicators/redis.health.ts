import { Injectable, Inject } from '@nestjs/common'
import { Redis } from 'ioredis'

export interface HealthIndicatorResult {
  status: 'up' | 'down'
  latencyMs: number
}

@Injectable()
export class RedisHealthIndicator {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async check(): Promise<HealthIndicatorResult> {
    const start = Date.now()
    try {
      await this.redis.ping()
      return { status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { status: 'down', latencyMs: Date.now() - start }
    }
  }
}
