import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { TrackingService } from './tracking.service'
import { PrismaService } from '../database/prisma.service'

@WebSocketGateway({ namespace: '/tracking', cors: { origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'] } })
export class TrackingGateway {
  @WebSocketServer()
  server: Server

  private lastBroadcast = new Map<string, number>()

  constructor(
    private readonly trackingService: TrackingService,
    private readonly prisma: PrismaService,
  ) {}

  @SubscribeMessage('driver:location')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lat: number; lng: number; bearing: number; speed: number; accuracy: number },
  ): Promise<void> {
    const driverId = client.data?.user?.sub
    if (!driverId) return

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

    this.server.to('admin:drivers:all').emit('admin:driver_location_changed', {
      driverId, lat: data.lat, lng: data.lng, orderId,
    })

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
        const eta = this.trackingService.calculateETA(data.lat, data.lng, addr[0].lat, addr[0].lng)
        this.server.to(room).emit('delivery:eta_updated', { orderId, etaMinutes: eta })
      }
    }
  }

  @SubscribeMessage('order:subscribe')
  handleOrderSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }): void {
    client.join(`order:${data.orderId}`)
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
    const distKm = this.haversineKm(last.lat, last.lng, lat, lng)
    const maxKm = (180 / 3600) * (elapsedMs / 1000) * 1.5
    return distKm > maxKm
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const toRad = (x: number) => (x * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
  }
}
