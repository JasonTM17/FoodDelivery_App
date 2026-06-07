import { Injectable, Inject } from '@nestjs/common'
import Redis from 'ioredis'
import { RouteResult } from '../common/types/location.types'

/** Caches the fetched route per order with a 2-minute TTL.
 *  Invalidated on driver_assigned + ready_for_pickup transitions (caller's responsibility). */
@Injectable()
export class EtaCacheService {
  /** 2-minute TTL matches the phase requirement (10 calls/order max). */
  private readonly TTL_SECONDS = 120

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async getRoute(orderId: string): Promise<RouteResult | null> {
    const raw = await this.redis.get(`route:${orderId}`)
    if (!raw) return null
    try {
      return JSON.parse(raw) as RouteResult
    } catch {
      return null
    }
  }

  async setRoute(orderId: string, result: RouteResult): Promise<void> {
    await this.redis.setex(`route:${orderId}`, this.TTL_SECONDS, JSON.stringify(result))
  }

  async invalidate(orderId: string): Promise<void> {
    await this.redis.del(`route:${orderId}`)
  }
}
