import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'
import { RouteResult } from '../common/types/location.types'

/** Caches fetched route geometry per order phase with a 2-minute TTL.
 *  Keys are supplied by TrackingService (for example: orderId:pickup/dropoff). */
@Injectable()
export class EtaCacheService {
  /** 2-minute TTL matches the phase requirement (10 calls/order max). */
  private readonly TTL_SECONDS = 120

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async getRoute(routeKey: string): Promise<RouteResult | null> {
    const raw = await this.redis.get(`route:${routeKey}`)
    if (!raw) return null
    try {
      return JSON.parse(raw) as RouteResult
    } catch {
      return null
    }
  }

  async setRoute(routeKey: string, result: RouteResult): Promise<void> {
    await this.redis.setex(`route:${routeKey}`, this.TTL_SECONDS, JSON.stringify(result))
  }

  async invalidate(routeKey: string): Promise<void> {
    await this.redis.del(`route:${routeKey}`)
  }
}
