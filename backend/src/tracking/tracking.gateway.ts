import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { UserRole } from '@prisma/client'
import { Server, Socket } from 'socket.io'
import { TrackingService } from './tracking.service'
import { PrismaService } from '../database/prisma.service'
import { haversineDistance } from '../common/utils/geo.utils'
import { OrdersGateway } from '../orders/orders.gateway'
import { WebSocketAuthService } from '../auth/websocket-auth.service'
import { RealtimeRoomAccessService } from '../orders/realtime-room-access.service'
import { websocketCorsOrigins } from '../common/websocket/websocket-cors'

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
    @MessageBody() data: { lat: number; lng: number; bearing: number; speed: number; accuracy: number },
  ): Promise<void> {
    const user = this.socketAuth.getUser(client)
    if (user?.role !== UserRole.driver) return
    const driverId = user.sub

    if (!this.isInVietnamBbox(data.lat, data.lng)) {
      client.emit('driver:location_rejected', { reason: 'out_of_bbox' })
      return
    }
    if (data.speed > 150) {
      client.emit('driver:location_rejected', { reason: 'speed_exceeded' })
      return
    }
    if (await this.isTeleportation(driverId, data.lat, data.lng)) {
      client.emit('driver:location_rejected', { reason: 'teleportation' })
      return
    }

    const orderId = await this.trackingService.handleLocationUpdate(driverId, data)
    if (!orderId) return

    const now = Date.now()
    const room = `order:${orderId}`
    const lastTime = this.lastBroadcast.get(room) ?? 0
    if (now - lastTime < 2000) return
    this.lastBroadcast.set(room, now)

    this.server.to(room).emit('driver:location_changed', {
      driverId, lat: data.lat, lng: data.lng,
      bearing: data.bearing, timestamp: new Date().toISOString(),
    })

    const adminEvent = {
      driverId,
      lat: data.lat,
      lng: data.lng,
      orderId,
      status: orderId ? 'delivering' as const : 'online' as const,
      timestamp: new Date().toISOString(),
    }
    this.server.to('admin:drivers:all').emit('admin:driver_location_changed', adminEvent)
    this.ordersGateway.notifyAdminDriverLocation(adminEvent)

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryAddressId: true },
    })
    if (order) {
      const addr = await this.prisma.$queryRawUnsafe<Array<{ lng: number; lat: number }>>(
        `SELECT ST_X(location::geometry)::float8 AS lng, ST_Y(location::geometry)::float8 AS lat
         FROM addresses WHERE id = $1::uuid LIMIT 1`, order.deliveryAddressId,
      )
      if (addr.length > 0) {
        const destLat = addr[0].lat
        const destLng = addr[0].lng

        // Try route cache first; fetches + caches on miss. If providers are unavailable,
        // emit a clearly degraded straight-line estimate instead of pretending it is a routed ETA.
        const route = await this.trackingService.getOrFetchRoute(
          orderId, data.lat, data.lng, destLat, destLng,
        )
        const etaMinutes = route
          ? Math.round(route.durationSeconds / 60)
          : this.trackingService.calculateETA(data.lat, data.lng, destLat, destLng)

        this.server.to(room).emit('delivery:eta_updated', {
          orderId,
          etaMinutes,
          source: route?.provider ?? 'straight_line_estimate',
          degraded: !route,
        })

        // Non-blocking: enqueue recompute when driver deviates >100m from cached polyline
        void this.trackingService.maybeEnqueueRecompute(orderId, data.lat, data.lng)
      }
    }
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
    return lat >= 4.5 && lat <= 23.5 && lng >= 102.0 && lng <= 117.5
  }

  private async isTeleportation(driverId: string, lat: number, lng: number): Promise<boolean> {
    const last = await this.trackingService.getDriverLocation(driverId)
    if (!last) return false
    const elapsedMs = Date.now() - new Date(last.timestamp).getTime()
    if (elapsedMs <= 0 || elapsedMs > 60_000) return false
    const distKm = haversineDistance(last.lat, last.lng, lat, lng)
    const maxKm = (180 / 3600) * (elapsedMs / 1000) * 1.5
    return distKm > maxKm
  }
}
