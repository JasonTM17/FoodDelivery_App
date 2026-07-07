import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { OrderStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { DirectionsApiService } from './directions-api.service'
import { EtaCacheService } from './eta-cache.service'
import { RecomputeJobData, routeCacheKey, routePhaseForStatus, type DeliveryRoutePhase } from './tracking.service'
import { TrackingGateway } from './tracking.gateway'

interface DestCoords {
  status: string
  restaurantLat: number
  restaurantLng: number
  deliveryLat: number
  deliveryLng: number
}

const STATUSES_BY_ROUTE_PHASE: Record<DeliveryRoutePhase, OrderStatus[]> = {
  pickup: [OrderStatus.driver_assigned, OrderStatus.driver_arriving_restaurant],
  dropoff: [OrderStatus.picked_up, OrderStatus.delivering],
}

@Processor('tracking-eta')
export class EtaRecomputeProcessor extends WorkerHost {
  private readonly logger = new Logger(EtaRecomputeProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly directionsApi: DirectionsApiService,
    private readonly etaCache: EtaCacheService,
    private readonly trackingGateway: TrackingGateway,
  ) {
    super()
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`ETA recompute completed for order ${job.data.orderId}`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`ETA recompute failed for order ${job.data.orderId}: ${err.message}`)
  }

  async process(job: Job<RecomputeJobData>): Promise<void> {
    const { orderId, lat, lng, phase } = job.data

    const coords = await this.prisma.$queryRaw<DestCoords[]>(Prisma.sql`
      SELECT o.status::text AS "status",
              ST_Y(r.location::geometry)::float8 AS "restaurantLat",
              ST_X(r.location::geometry)::float8 AS "restaurantLng",
              ST_Y(a.location::geometry)::float8 AS "deliveryLat",
              ST_X(a.location::geometry)::float8 AS "deliveryLng"
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       JOIN addresses a ON a.id = o.delivery_address_id
       WHERE o.id = CAST(${orderId} AS uuid)
       LIMIT 1
    `)

    if (!coords.length) {
      this.logger.warn(`No delivery address found for order ${orderId} — skipping recompute`)
      return
    }

    const destination = coords[0]
    const currentPhase = routePhaseForStatus(destination.status)
    if (currentPhase !== phase) {
      this.logger.warn(
        `Skipping stale ETA recompute for order ${orderId}: queued ${phase}, current ${currentPhase} (${destination.status})`,
      )
      return
    }

    const destLat = phase === 'pickup' ? destination.restaurantLat : destination.deliveryLat
    const destLng = phase === 'pickup' ? destination.restaurantLng : destination.deliveryLng
    const route = await this.directionsApi.fetchRoute(
      { lat, lng },
      { lat: destLat, lng: destLng },
    )
    const cacheKey = routeCacheKey(orderId, phase)

    // Invalidate stale cache then write fresh entry
    await this.etaCache.invalidate(cacheKey)
    await this.etaCache.setRoute(cacheKey, route)
    const updateResult = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: { in: STATUSES_BY_ROUTE_PHASE[phase] },
      },
      data: {
        routePolyline: route.polyline,
        routeWaypoints: route.waypoints as unknown as Prisma.InputJsonValue,
      },
    })
    if (updateResult.count === 0) {
      this.logger.warn(`Skipping ETA emit for order ${orderId}: status changed during ${phase} recompute`)
      return
    }

    this.trackingGateway.emitEtaUpdate(orderId, {
      etaMinutes: Math.max(1, Math.round(route.durationSeconds / 60)),
      source: route.provider,
      degraded: false,
      routePolyline: route.polyline,
      routePhase: phase,
    })

    this.logger.log(
      `Recomputed ${phase} route for order ${orderId}: ${Math.round(route.durationSeconds / 60)} min via ${route.provider}`,
    )
  }
}
