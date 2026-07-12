import {
  Optional,
} from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Prisma, UserRole } from '@prisma/client'
import { Server, Socket } from 'socket.io'
import { type DeliveryRoutePhase, routePhaseForStatus, TrackingService } from './tracking.service'
import { PrismaService } from '../database/prisma.service'
import { haversineDistance } from '../common/utils/geo.utils'
import { estimateRemainingRouteMetrics } from '../common/utils/route.utils'
import { isWithinVietnamDeliveryBounds } from '../common/utils/delivery-area.utils'
import { OrdersGateway, type AdminDriverLocationChangedEvent } from '../orders/orders.gateway'
import { WebSocketAuthService } from '../auth/websocket-auth.service'
import { RealtimeRoomAccessService } from '../orders/realtime-room-access.service'
import { websocketCorsOrigins } from '../common/websocket/websocket-cors'
import { realtimeChannels } from '../realtime/realtime-channels'
import { RealtimePublisherService } from '../realtime/realtime-publisher.service'

export interface DeliveryEtaUpdatedEvent {
  etaMinutes: number | null
  source: string
  degraded: boolean
  routePolyline: string | null
  routePhase: DeliveryRoutePhase
}

export interface DriverLocationUpdateInput {
  lat: number
  lng: number
  bearing?: number
  speed?: number
  accuracy?: number
  timestamp?: string
}

export type DriverLocationRejectionReason =
  | 'out_of_bbox'
  | 'speed_exceeded'
  | 'invalid_timestamp'
  | 'stale_timestamp'
  | 'future_timestamp'
  | 'teleportation'

export type DriverLocationUpdateResult =
  | { accepted: true; orderId: string | null; timestamp: string }
  | { accepted: false; reason: DriverLocationRejectionReason }

const MAX_LIVE_LOCATION_AGE_MS = 45_000
const MAX_LOCATION_CLOCK_SKEW_FUTURE_MS = 15_000
const IDEMPOTENT_LOCATION_TOLERANCE_KM = 0.02

@WebSocketGateway({ namespace: '/tracking', cors: { origin: websocketCorsOrigins() } })
export class TrackingGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  private lastBroadcast = new Map<string, number>()

  constructor(
    private readonly trackingService: TrackingService,
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
    private readonly socketAuth: WebSocketAuthService,
    private readonly roomAccess: RealtimeRoomAccessService,
    @Optional() private readonly realtimePublisher?: RealtimePublisherService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      await this.socketAuth.authenticate(client)
      client.emit('auth:ready')
    } catch {
      client.disconnect(true)
    }
  }

  @SubscribeMessage('driver:location')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DriverLocationUpdateInput,
  ): Promise<void> {
    const user = this.socketAuth.getUser(client)
    if (user?.role !== UserRole.driver) return

    const result = await this.processLocationUpdate(user.sub, data)
    if (!result.accepted) {
      client.emit('driver:location_rejected', { reason: result.reason })
    }
  }

  async processLocationUpdate(
    driverId: string,
    data: DriverLocationUpdateInput,
  ): Promise<DriverLocationUpdateResult> {

    if (!this.isInVietnamBbox(data.lat, data.lng)) {
      return { accepted: false, reason: 'out_of_bbox' }
    }
    if (
      typeof data.speed === 'number' &&
      Number.isFinite(data.speed) &&
      data.speed > 150
    ) {
      return { accepted: false, reason: 'speed_exceeded' }
    }
    const sampleTimestamp = parseDriverLocationTimestamp(data.timestamp)
    if (!sampleTimestamp) {
      return { accepted: false, reason: 'invalid_timestamp' }
    }
    const sampleAgeMs = Date.now() - sampleTimestamp.getTime()
    if (sampleAgeMs > MAX_LIVE_LOCATION_AGE_MS) {
      return { accepted: false, reason: 'stale_timestamp' }
    }
    if (sampleAgeMs < -MAX_LOCATION_CLOCK_SKEW_FUTURE_MS) {
      return { accepted: false, reason: 'future_timestamp' }
    }
    const timestamp = sampleTimestamp.toISOString()
    if (await this.isTeleportation(driverId, data.lat, data.lng, sampleTimestamp)) {
      return { accepted: false, reason: 'teleportation' }
    }

    const orderId = await this.trackingService.handleLocationUpdate(driverId, { ...data, timestamp })
    this.emitAdminDriverLocation(driverId, {
      driverId,
      lat: data.lat,
      lng: data.lng,
      ...(orderId ? { orderId } : {}),
      status: orderId ? 'delivering' : 'online',
      timestamp,
    })

    if (!orderId) return { accepted: true, orderId: null, timestamp }

    const now = Date.now()
    const room = `order:${orderId}`
    const lastTime = this.lastBroadcast.get(room) ?? 0
    if (now - lastTime < 2000) {
      return { accepted: true, orderId, timestamp }
    }
    this.lastBroadcast.set(room, now)

    const routeTarget = await this.prisma.$queryRaw<Array<{
      status: string
      restaurantLng: number
      restaurantLat: number
      deliveryLng: number
      deliveryLat: number
    }>>(Prisma.sql`
      SELECT o.status::text AS "status",
              ST_X(r.location::geometry)::float8 AS "restaurantLng",
              ST_Y(r.location::geometry)::float8 AS "restaurantLat",
              ST_X(a.location::geometry)::float8 AS "deliveryLng",
              ST_Y(a.location::geometry)::float8 AS "deliveryLat"
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       JOIN addresses a ON a.id = o.delivery_address_id
       WHERE o.id = CAST(${orderId} AS uuid)
         AND o.driver_id = CAST(${driverId} AS uuid)
       LIMIT 1
    `)
    const target = routeTarget[0]
    if (target) {
      const driverLocationPayload = {
        orderId, driverId, lat: data.lat, lng: data.lng,
        bearing: typeof data.bearing === 'number' && Number.isFinite(data.bearing)
          ? data.bearing
          : null,
        timestamp,
      }
      this.server?.to(room).emit('driver:location_changed', driverLocationPayload)
      void this.realtimePublisher?.publish(
        realtimeChannels.order(orderId),
        'driver:location_changed',
        driverLocationPayload,
      )

      const routePhase = routePhaseForStatus(target.status)
      const destLat = routePhase === 'pickup' ? target.restaurantLat : target.deliveryLat
      const destLng = routePhase === 'pickup' ? target.restaurantLng : target.deliveryLng

      // Try route cache first; fetches + caches on miss. If providers are unavailable,
      // emit an explicit unavailable ETA instead of fabricating a straight-line travel time.
      const route = await this.trackingService.getOrFetchRoute(
        orderId, data.lat, data.lng, destLat, destLng, routePhase,
      )
      const remainingRoute = route
        ? estimateRemainingRouteMetrics(
          route.polyline,
          data.lat,
          data.lng,
          route.distanceMeters,
          route.durationSeconds,
        )
        : null
      const remainingDurationSeconds = remainingRoute?.remainingDurationSeconds ?? route?.durationSeconds
      const etaMinutes = typeof remainingDurationSeconds === 'number'
        ? Math.max(0, Math.round(remainingDurationSeconds / 60))
        : null

      this.emitEtaUpdate(orderId, {
        etaMinutes,
        source: route?.provider ?? 'route_unavailable',
        degraded: !route,
        routePolyline: route?.polyline ?? null,
        routePhase,
      })

      // Non-blocking: enqueue recompute when driver deviates >100m from cached polyline
      void this.trackingService.maybeEnqueueRecompute(orderId, data.lat, data.lng, routePhase)
    }

    return { accepted: true, orderId, timestamp }
  }

  emitEtaUpdate(orderId: string, data: DeliveryEtaUpdatedEvent): void {
    const payload = {
      orderId,
      ...data,
    }
    this.server?.to(`order:${orderId}`).emit('delivery:eta_updated', payload)
    void this.realtimePublisher?.publish(
      realtimeChannels.order(orderId),
      'delivery:eta_updated',
      payload,
    )
  }

  @SubscribeMessage('order:subscribe')
  async handleOrderSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): Promise<{ success: boolean }> {
    const user = this.socketAuth.getUser(client)
    if (!user || !data?.orderId || !(await this.roomAccess.canAccessOrder(user, data.orderId))) {
      return { success: false }
    }
    client.join(`order:${data.orderId}`)
    return { success: true }
  }

  @SubscribeMessage('order:unsubscribe')
  handleOrderUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }): void {
    client.leave(`order:${data.orderId}`)
  }

  private isInVietnamBbox(lat: number, lng: number): boolean {
    return isWithinVietnamDeliveryBounds(lat, lng)
  }

  private async isTeleportation(driverId: string, lat: number, lng: number, sampleTimestamp: Date): Promise<boolean> {
    const last = await this.trackingService.getDriverLocation(driverId)
    if (!last) return false
    const elapsedMs = sampleTimestamp.getTime() - new Date(last.timestamp).getTime()
    const distKm = haversineDistance(last.lat, last.lng, lat, lng)
    // /driver/online stores the initial sample before Socket.IO republishes it
    // to subscribed maps. Treat that exact, stationary replay as idempotent;
    // a timestamp reused at a materially different coordinate remains invalid.
    if (elapsedMs === 0) return distKm > IDEMPOTENT_LOCATION_TOLERANCE_KM
    // Reject future / stale client timestamps (anti-spoof for teleport checks)
    if (elapsedMs < 0) return true
    if (elapsedMs > 60_000) return true
    const maxKm = (180 / 3600) * (elapsedMs / 1000) * 1.5
    return distKm > maxKm
  }

  private emitAdminDriverLocation(
    driverId: string,
    data: AdminDriverLocationChangedEvent,
  ): void {
    const key = `admin:driver:${driverId}`
    const now = Date.now()
    const lastTime = this.lastBroadcast.get(key) ?? 0
    if (now - lastTime < 2000) return

    this.lastBroadcast.set(key, now)
    this.server?.to('admin:drivers:all').emit('admin:driver_location_changed', data)
    this.ordersGateway.notifyAdminDriverLocation(data)
  }
}

function parseDriverLocationTimestamp(timestamp: string | undefined): Date | null {
  if (!timestamp) return null
  const parsed = new Date(timestamp)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}
