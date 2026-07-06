import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { OrderStatus, type Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { DirectionsApiService } from './directions-api.service'
import { EtaCacheService } from './eta-cache.service'
import { hasDeviatedFromRoute } from '../common/utils/route.utils'
import { RouteResult } from '../common/types/location.types'
import Redis from 'ioredis'

export type DeliveryRoutePhase = 'pickup' | 'dropoff'

const ACTIVE_DRIVER_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.driver_assigned,
  OrderStatus.driver_arriving_restaurant,
  OrderStatus.picked_up,
  OrderStatus.delivering,
]

export function routePhaseForStatus(status: string): DeliveryRoutePhase {
  return status === 'driver_assigned' || status === 'driver_arriving_restaurant'
    ? 'pickup'
    : 'dropoff'
}

export function routeCacheKey(orderId: string, phase: DeliveryRoutePhase): string {
  return `${orderId}:${phase}`
}

interface LocationData {
  lat: number
  lng: number
  bearing?: number
  speed?: number
  accuracy?: number
}

interface LocationRecord {
  driverId: string
  orderId: string | null
  lng: number
  lat: number
  recordedAt: Date
}

export interface RecomputeJobData {
  orderId: string
  lat: number
  lng: number
  phase: DeliveryRoutePhase
}

@Injectable()
export class TrackingService implements OnModuleDestroy {
  private readonly logger = new Logger(TrackingService.name)
  private batchBuffer: LocationRecord[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly directionsApi: DirectionsApiService,
    private readonly etaCache: EtaCacheService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @InjectQueue('tracking-eta') private readonly etaQueue: Queue,
  ) {
    this.flushInterval = setInterval(() => this.flush(), 15000)
  }

  onModuleDestroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  async handleLocationUpdate(driverId: string, data: LocationData): Promise<string | null> {
    const recordedAt = new Date()
    await this.redis.geoadd('drivers:active', data.lng, data.lat, `driver:${driverId}`)
    await this.redis.setex(`driver:${driverId}:alive`, 35, '1')
    await this.redis.setex(`driver:${driverId}:last_seen_at`, 35, recordedAt.toISOString())

    const orderId = await this.resolveActiveOrderForDriver(driverId)
    this.batchBuffer.push({ driverId, orderId: orderId || null, lng: data.lng, lat: data.lat, recordedAt })
    return orderId || null
  }

  /**
   * Returns a cached or freshly fetched route for the order.
   * On cache miss, fetches from the Directions API and persists the polyline
   * + waypoints to Order (fire-and-forget — does not block the WS handler).
   */
  async getOrFetchRoute(
    orderId: string,
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    phase: DeliveryRoutePhase = 'dropoff',
  ): Promise<RouteResult | null> {
    const cacheKey = routeCacheKey(orderId, phase)
    const cached = await this.etaCache.getRoute(cacheKey)
    if (cached) return cached

    try {
      const route = await this.directionsApi.fetchRoute(
        { lat: originLat, lng: originLng },
        { lat: destLat, lng: destLng },
      )
      await this.etaCache.setRoute(cacheKey, route)
      // Persist to DB non-blocking; failure is logged, not thrown
      void this.persistRouteToOrder(orderId, route)
      return route
    } catch (err) {
      this.logger.error(`Route fetch failed for order ${orderId}: ${(err as Error).message}`)
      return null
    }
  }

  /**
   * Enqueues an ETA recompute job when the driver deviates >100 m from the
   * cached polyline. Uses a stable jobId to avoid queue spam per order.
   */
  async maybeEnqueueRecompute(
    orderId: string,
    lat: number,
    lng: number,
    phase: DeliveryRoutePhase = 'dropoff',
  ): Promise<void> {
    const cacheKey = routeCacheKey(orderId, phase)
    const cached = await this.etaCache.getRoute(cacheKey)
    if (!cached) return

    if (hasDeviatedFromRoute(cached.polyline, lat, lng)) {
      await this.etaQueue.add(
        'recompute-route',
        { orderId, lat, lng, phase } satisfies RecomputeJobData,
        {
          removeOnComplete: true,
          removeOnFail: 100,
          // Deduplicate: only one pending recompute per order at a time
          jobId: `recompute:${orderId}:${phase}`,
        },
      )
    }
  }

  async getDriverLocation(driverId: string): Promise<{ lat: number; lng: number; timestamp: string } | null> {
    const [pos, timestamp] = await Promise.all([
      this.redis.geopos('drivers:active', `driver:${driverId}`),
      this.redis.get(`driver:${driverId}:last_seen_at`),
    ])
    if (!pos || !pos[0]) return null
    if (!timestamp) return null
    const [lng, lat] = pos[0]
    return { lat: parseFloat(lat), lng: parseFloat(lng), timestamp }
  }

  getCachedRoute(orderId: string, phase: DeliveryRoutePhase = 'dropoff'): Promise<RouteResult | null> {
    return this.etaCache.getRoute(routeCacheKey(orderId, phase))
  }

  async resolveActiveOrderForDriver(driverId: string): Promise<string | null> {
    const currentOrderKey = `driver:${driverId}:current_order`
    const redisOrderId = normalizeRedisOrderId(await this.redis.get(currentOrderKey))

    if (redisOrderId) {
      const verified = await this.prisma.order.findFirst({
        where: {
          id: redisOrderId,
          driverId,
          status: { in: ACTIVE_DRIVER_ORDER_STATUSES },
        },
        select: { id: true },
      })
      if (verified) return verified.id

      this.logger.warn(`Ignoring stale current_order ${redisOrderId} for driver ${driverId}`)
      await this.redis.del(currentOrderKey)
    }

    const activeOrder = await this.prisma.order.findFirst({
      where: {
        driverId,
        status: { in: ACTIVE_DRIVER_ORDER_STATUSES },
      },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    })
    if (!activeOrder) return null

    await Promise.all([
      this.redis.set(`driver:${driverId}:status`, 'busy'),
      this.redis.set(currentOrderKey, activeOrder.id),
      this.redis.del(`driver:${driverId}:idle_since`),
    ])
    return activeOrder.id
  }

  async findNearbyDriversPostGIS(
    lat: number, lng: number, radiusKm: number,
  ): Promise<Array<{ driverId: string; distKm: number; rating: number }>> {
    return this.prisma.$queryRawUnsafe<Array<{ driverId: string; distKm: number; rating: number }>>(
      `SELECT d.user_id AS "driverId",
              ST_Distance(dl.location, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography) / 1000 AS "distKm",
              d.rating::float8 AS "rating"
       FROM driver_profiles d
       JOIN driver_location_history dl ON dl.driver_id = d.user_id
       WHERE d.is_online = true
         AND ST_DWithin(dl.location, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography, $3::float8)
         AND dl.recorded_at > NOW() - INTERVAL '30 seconds'
         AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.driver_id = d.user_id
             AND o.status IN ('driver_assigned','driver_arriving_restaurant','picked_up','delivering'))
       ORDER BY "distKm", rating DESC LIMIT 10`,
      lng, lat, radiusKm * 1000,
    )
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async persistRouteToOrder(orderId: string, route: RouteResult): Promise<void> {
    try {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          routePolyline: route.polyline,
          routeWaypoints: route.waypoints as unknown as Prisma.InputJsonValue,
        },
      })
    } catch (err) {
      this.logger.warn(`Failed to persist route for order ${orderId}: ${(err as Error).message}`)
    }
  }

  private async flush(): Promise<void> {
    if (this.batchBuffer.length === 0) return
    const batch = [...this.batchBuffer]
    this.batchBuffer = []
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO driver_location_history (driver_id, order_id, location, recorded_at)
         VALUES ${batch.map((_, i) => `($${i * 5 + 1}::uuid, $${i * 5 + 2}::uuid, ST_SetSRID(ST_MakePoint($${i * 5 + 3}::float8, $${i * 5 + 4}::float8), 4326), $${i * 5 + 5}::timestamptz)`).join(', ')}`,
        ...batch.flatMap((r) => [r.driverId, r.orderId, r.lng, r.lat, r.recordedAt]),
      )
    } catch (err) {
      this.logger.error(`Failed to flush location batch: ${(err as Error).message}`)
    }
  }
}

function normalizeRedisOrderId(value: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
