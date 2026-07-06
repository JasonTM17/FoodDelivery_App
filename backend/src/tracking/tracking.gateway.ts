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
import { isWithinVietnamDeliveryBounds } from '../common/utils/delivery-area.utils'
import { OrdersGateway, type AdminDriverLocationChangedEvent } from '../orders/orders.gateway'
import { WebSocketAuthService } from '../auth/websocket-auth.service'
import { RealtimeRoomAccessService } from '../orders/realtime-room-access.service'
import { websocketCorsOrigins } from '../common/websocket/websocket-cors'

export interface DeliveryEtaUpdatedEvent {
  etaMinutes: number | null
  source: string
  degraded: boolean
  routePolyline: string | null
  routePhase: DeliveryRoutePhase
}

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
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      await this.socketAuth.authenticate(client)
    } catch {
      client.disconnect(true)
    }
  }

  @SubscribeMessage('driver:location')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lat: number; lng: number; bearing?: number; speed?: number; accuracy?: number; timestamp?: string },
  ): Promise<void> {
    const user = this.socketAuth.getUser(client)
    if (user?.role !== UserRole.driver) return
    const driverId = user.sub

    if (!this.isInVietnamBbox(data.lat, data.lng)) {
      client.emit('driver:location_rejected', { reason: 'out_of_bbox' })
      return
    }
    if (
      typeof data.speed === 'number' &&
      Number.isFinite(data.speed) &&
      data.speed > 150
    ) {
      client.emit('driver:location_rejected', { reason: 'speed_exceeded' })
      return
    }
    const sampleTimestamp = parseDriverLocationTimestamp(data.timestamp)
    if (!sampleTimestamp) {
      client.emit('driver:location_rejected', { reason: 'invalid_timestamp' })
      return
    }
    const timestamp = sampleTimestamp.toISOString()
    if (await this.isTeleportation(driverId, data.lat, data.lng, sampleTimestamp)) {
      client.emit('driver:location_rejected', { reason: 'teleportation' })
      return
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

    if (!orderId) return

    const now = Date.now()
    const room = `order:${orderId}`
    const lastTime = this.lastBroadcast.get(room) ?? 0
    if (now - lastTime < 2000) return
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
      this.server.to(room).emit('driver:location_changed', {
        orderId, driverId, lat: data.lat, lng: data.lng,
        bearing: typeof data.bearing === 'number' && Number.isFinite(data.bearing)
          ? data.bearing
          : null,
        timestamp,
      })

      const routePhase = routePhaseForStatus(target.status)
      const destLat = routePhase === 'pickup' ? target.restaurantLat : target.deliveryLat
      const destLng = routePhase === 'pickup' ? target.restaurantLng : target.deliveryLng

      // Try route cache first; fetches + caches on miss. If providers are unavailable,
      // emit an explicit unavailable ETA instead of fabricating a straight-line travel time.
      const route = await this.trackingService.getOrFetchRoute(
        orderId, data.lat, data.lng, destLat, destLng, routePhase,
      )
      const etaMinutes = route ? Math.max(1, Math.round(route.durationSeconds / 60)) : null

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
  }

  emitEtaUpdate(orderId: string, data: DeliveryEtaUpdatedEvent): void {
    this.server.to(`order:${orderId}`).emit('delivery:eta_updated', {
      orderId,
      ...data,
    })
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
    if (elapsedMs <= 0 || elapsedMs > 60_000) return false
    const distKm = haversineDistance(last.lat, last.lng, lat, lng)
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
    this.server.to('admin:drivers:all').emit('admin:driver_location_changed', data)
    this.ordersGateway.notifyAdminDriverLocation(data)
  }
}

function parseDriverLocationTimestamp(timestamp: string | undefined): Date | null {
  if (!timestamp) return new Date()
  const parsed = new Date(timestamp)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}
