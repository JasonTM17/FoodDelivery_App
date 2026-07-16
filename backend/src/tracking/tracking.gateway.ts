import {
  Logger,
  OnModuleDestroy,
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
import {
  DriverOfflineLocationError,
  type DeliveryRoutePhase,
  routePhaseForStatus,
  TrackingService,
} from './tracking.service'
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
import { TrackingMetrics } from './tracking.metrics'

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
  | 'invalid_coordinates'
  | 'out_of_bbox'
  | 'invalid_bearing'
  | 'invalid_speed'
  | 'speed_exceeded'
  | 'poor_accuracy'
  | 'invalid_timestamp'
  | 'stale_timestamp'
  | 'future_timestamp'
  | 'driver_offline'
  | 'teleportation'

export type DriverLocationUpdateResult =
  | { accepted: true; orderId: string | null; timestamp: string }
  | { accepted: false; reason: DriverLocationRejectionReason }

interface PendingOrderBroadcast {
  driverId: string
  orderId: string
  data: DriverLocationUpdateInput
  timestamp: string
}

const MAX_LIVE_LOCATION_AGE_MS = 45_000
const MAX_LOCATION_CLOCK_SKEW_FUTURE_MS = 15_000
const MAX_LIVE_LOCATION_ACCURACY_METERS = 50
const IDEMPOTENT_LOCATION_TOLERANCE_KM = 0.02
const ORDER_BROADCAST_INTERVAL_MS = 2_000

@WebSocketGateway({ namespace: '/tracking', cors: { origin: websocketCorsOrigins() } })
export class TrackingGateway implements OnGatewayConnection, OnModuleDestroy {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(TrackingGateway.name)
  private lastBroadcast = new Map<string, number>()
  private pendingOrderBroadcasts = new Map<string, PendingOrderBroadcast>()
  private orderBroadcastTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private pendingAdminBroadcasts = new Map<string, AdminDriverLocationChangedEvent>()
  private adminBroadcastTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private lastBroadcastExpiryTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private orderBroadcastTasks = new Map<string, Promise<void>>()

  constructor(
    private readonly trackingService: TrackingService,
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
    private readonly socketAuth: WebSocketAuthService,
    private readonly roomAccess: RealtimeRoomAccessService,
    @Optional() private readonly realtimePublisher?: RealtimePublisherService,
    @Optional() private readonly metrics?: TrackingMetrics,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      await this.socketAuth.authenticate(client)
      this.metrics?.recordSocketConnection(client.recovered ? 'recovered' : 'authenticated')
      client.emit('auth:ready')
    } catch {
      this.metrics?.recordSocketConnection('rejected')
      client.disconnect(true)
    }
  }

  async onModuleDestroy(): Promise<void> {
    const pendingOrders = [...this.pendingOrderBroadcasts.values()]
    const pendingAdmins = [...this.pendingAdminBroadcasts.values()]
    for (const timer of this.orderBroadcastTimers.values()) clearTimeout(timer)
    for (const timer of this.adminBroadcastTimers.values()) clearTimeout(timer)
    for (const timer of this.lastBroadcastExpiryTimers.values()) clearTimeout(timer)
    this.orderBroadcastTimers.clear()
    this.adminBroadcastTimers.clear()
    this.lastBroadcastExpiryTimers.clear()
    this.pendingOrderBroadcasts.clear()
    this.pendingAdminBroadcasts.clear()
    this.lastBroadcast.clear()

    pendingAdmins.forEach((data) => this.broadcastAdminDriverLocation(data))
    pendingOrders.forEach((location) => {
      void this.queueOrderBroadcast(location)
    })
    await Promise.all([...this.orderBroadcastTasks.values()])
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

    if (
      !data ||
      typeof data !== 'object' ||
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng)
    ) {
      return this.rejectLocation('invalid_coordinates')
    }
    if (!this.isInVietnamBbox(data.lat, data.lng)) {
      return this.rejectLocation('out_of_bbox')
    }
    if (
      data.bearing !== undefined &&
      (!Number.isFinite(data.bearing) || data.bearing < 0 || data.bearing >= 360)
    ) {
      return this.rejectLocation('invalid_bearing')
    }
    if (
      data.speed !== undefined &&
      (!Number.isFinite(data.speed) || data.speed < 0)
    ) {
      return this.rejectLocation('invalid_speed')
    }
    if (
      data.speed !== undefined &&
      data.speed > 150
    ) {
      return this.rejectLocation('speed_exceeded')
    }
    if (
      data.accuracy !== undefined &&
      (!Number.isFinite(data.accuracy) ||
        data.accuracy < 0 ||
        data.accuracy > MAX_LIVE_LOCATION_ACCURACY_METERS)
    ) {
      return this.rejectLocation('poor_accuracy')
    }
    const sampleTimestamp = parseDriverLocationTimestamp(data.timestamp)
    if (!sampleTimestamp) {
      return this.rejectLocation('invalid_timestamp')
    }
    const sampleAgeMs = Date.now() - sampleTimestamp.getTime()
    if (sampleAgeMs > MAX_LIVE_LOCATION_AGE_MS) {
      return this.rejectLocation('stale_timestamp')
    }
    if (sampleAgeMs < -MAX_LOCATION_CLOCK_SKEW_FUTURE_MS) {
      return this.rejectLocation('future_timestamp')
    }
    const timestamp = sampleTimestamp.toISOString()
    if (await this.isTeleportation(driverId, data.lat, data.lng, sampleTimestamp)) {
      return this.rejectLocation('teleportation')
    }

    let orderId: string | null
    try {
      orderId = await this.trackingService.handleLocationUpdate(driverId, { ...data, timestamp })
    } catch (error) {
      if (error instanceof DriverOfflineLocationError) {
        return this.rejectLocation('driver_offline')
      }
      throw error
    }
    this.metrics?.recordGpsAccepted(sampleAgeMs)
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
    if (now - lastTime < ORDER_BROADCAST_INTERVAL_MS) {
      this.scheduleTrailingOrderBroadcast({ driverId, orderId, data, timestamp })
      return { accepted: true, orderId, timestamp }
    }
    this.clearTrailingOrderBroadcast(room)
    this.markBroadcast(room, now)

    await this.queueOrderBroadcast({ driverId, orderId, data, timestamp })

    return { accepted: true, orderId, timestamp }
  }

  private async broadcastOrderLocation(location: PendingOrderBroadcast): Promise<void> {
    const { driverId, orderId, data, timestamp } = location
    const room = `order:${orderId}`
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
      void this.realtimePublisher?.publishBestEffort(
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
      void this.trackingService
        .maybeEnqueueRecompute(orderId, data.lat, data.lng, routePhase)
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error)
          this.logger.warn(`ETA recompute enqueue failed for order ${orderId}: ${message}`)
        })
    }
  }

  private scheduleTrailingOrderBroadcast(location: PendingOrderBroadcast): void {
    const room = `order:${location.orderId}`
    this.pendingOrderBroadcasts.set(room, location)
    if (this.orderBroadcastTimers.has(room)) return

    const elapsedMs = Date.now() - (this.lastBroadcast.get(room) ?? 0)
    const delayMs = Math.max(0, ORDER_BROADCAST_INTERVAL_MS - elapsedMs)
    const timer = setTimeout(() => {
      this.orderBroadcastTimers.delete(room)
      const latest = this.pendingOrderBroadcasts.get(room)
      this.pendingOrderBroadcasts.delete(room)
      if (!latest) return

      this.markBroadcast(room)
      void this.queueOrderBroadcast(latest)
    }, delayMs)
    timer.unref?.()
    this.orderBroadcastTimers.set(room, timer)
  }

  private clearTrailingOrderBroadcast(room: string): void {
    const timer = this.orderBroadcastTimers.get(room)
    if (timer) clearTimeout(timer)
    this.orderBroadcastTimers.delete(room)
    this.pendingOrderBroadcasts.delete(room)
  }

  private async broadcastOrderLocationSafely(location: PendingOrderBroadcast): Promise<void> {
    try {
      await this.broadcastOrderLocation(location)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Trailing GPS broadcast failed for order ${location.orderId}: ${message}`)
    }
  }

  private queueOrderBroadcast(location: PendingOrderBroadcast): Promise<void> {
    const room = `order:${location.orderId}`
    const previous = this.orderBroadcastTasks.get(room) ?? Promise.resolve()
    const task = previous.then(() => this.broadcastOrderLocationSafely(location))
    this.orderBroadcastTasks.set(room, task)
    void task.then(() => {
      if (this.orderBroadcastTasks.get(room) === task) {
        this.orderBroadcastTasks.delete(room)
      }
    })
    return task
  }

  emitEtaUpdate(orderId: string, data: DeliveryEtaUpdatedEvent): void {
    const payload = {
      orderId,
      ...data,
    }
    this.server?.to(`order:${orderId}`).emit('delivery:eta_updated', payload)
    void this.realtimePublisher?.publishBestEffort(
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

  private rejectLocation(reason: DriverLocationRejectionReason): DriverLocationUpdateResult {
    this.metrics?.recordGpsRejected(reason)
    return { accepted: false, reason }
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
    if (now - lastTime < ORDER_BROADCAST_INTERVAL_MS) {
      this.scheduleTrailingAdminBroadcast(key, data)
      return
    }

    this.clearTrailingAdminBroadcast(key)
    this.markBroadcast(key, now)
    this.broadcastAdminDriverLocation(data)
  }

  private scheduleTrailingAdminBroadcast(
    key: string,
    data: AdminDriverLocationChangedEvent,
  ): void {
    this.pendingAdminBroadcasts.set(key, data)
    if (this.adminBroadcastTimers.has(key)) return

    const elapsedMs = Date.now() - (this.lastBroadcast.get(key) ?? 0)
    const delayMs = Math.max(0, ORDER_BROADCAST_INTERVAL_MS - elapsedMs)
    const timer = setTimeout(() => {
      this.adminBroadcastTimers.delete(key)
      const latest = this.pendingAdminBroadcasts.get(key)
      this.pendingAdminBroadcasts.delete(key)
      if (!latest) return

      this.markBroadcast(key)
      this.broadcastAdminDriverLocation(latest)
    }, delayMs)
    timer.unref?.()
    this.adminBroadcastTimers.set(key, timer)
  }

  private clearTrailingAdminBroadcast(key: string): void {
    const timer = this.adminBroadcastTimers.get(key)
    if (timer) clearTimeout(timer)
    this.adminBroadcastTimers.delete(key)
    this.pendingAdminBroadcasts.delete(key)
  }

  private broadcastAdminDriverLocation(data: AdminDriverLocationChangedEvent): void {
    this.server?.to('admin:drivers:all').emit('admin:driver_location_changed', data)
    this.ordersGateway.notifyAdminDriverLocation(data)
  }

  private markBroadcast(key: string, timestamp = Date.now()): void {
    this.lastBroadcast.set(key, timestamp)
    const previousExpiry = this.lastBroadcastExpiryTimers.get(key)
    if (previousExpiry) clearTimeout(previousExpiry)

    const timer = setTimeout(() => {
      if (this.lastBroadcast.get(key) === timestamp) this.lastBroadcast.delete(key)
      this.lastBroadcastExpiryTimers.delete(key)
    }, ORDER_BROADCAST_INTERVAL_MS)
    timer.unref?.()
    this.lastBroadcastExpiryTimers.set(key, timer)
  }
}

function parseDriverLocationTimestamp(timestamp: string | undefined): Date | null {
  if (!timestamp) return null
  const parsed = new Date(timestamp)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}
