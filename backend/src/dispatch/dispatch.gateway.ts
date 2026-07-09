import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Inject, Optional } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { Server } from 'socket.io'
import type { Socket } from 'socket.io'
import Redis from 'ioredis'
import { WebSocketAuthService } from '../auth/websocket-auth.service'
import { websocketCorsOrigins } from '../common/websocket/websocket-cors'
import { realtimeChannels } from '../realtime/realtime-channels'
import { RealtimePublisherService } from '../realtime/realtime-publisher.service'

type OfferCallback = (accepted: boolean) => void

@WebSocketGateway({ namespace: '/dispatch', cors: { origin: websocketCorsOrigins() } })
export class DispatchGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  private offerCallbacks = new Map<string, OfferCallback>()

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly socketAuth: WebSocketAuthService,
    @Optional() private readonly realtimePublisher?: RealtimePublisherService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.socketAuth.authenticate(client)
      if (user.role !== UserRole.driver) {
        client.disconnect(true)
        return
      }
      client.join(`driver:${user.sub}`)
    } catch {
      client.disconnect(true)
    }
  }

  sendNewOrderOffer(driverId: string, data: Record<string, unknown>): void {
    this.server?.to(`driver:${driverId}`).emit('driver:new_order', data)
    void this.realtimePublisher?.publish(realtimeChannels.driver(driverId), 'driver:new_order', data)
  }

  sendAssignedOrder(driverId: string, data: { orderId: string }): void {
    this.server?.to(`driver:${driverId}`).emit('driver:order_assigned', data)
    void this.realtimePublisher?.publish(realtimeChannels.driver(driverId), 'driver:order_assigned', data)
  }

  registerOfferResponse(key: string, callback: OfferCallback): void {
    this.offerCallbacks.set(key, callback)
  }

  resolveOffer(orderId: string, driverId: string, accepted: boolean): boolean {
    const key = `${orderId}:${driverId}`
    const callback = this.offerCallbacks.get(key)
    if (callback) {
      this.offerCallbacks.delete(key)
      callback(accepted)
      return true
    }
    return false
  }

  emitToAdmins(event: string, data: Record<string, unknown>): void {
    this.server?.emit(event, data)
    void this.realtimePublisher?.publish(realtimeChannels.adminOrders, event, data)
  }

  @SubscribeMessage('dispatch:accept')
  async handleAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; offerToken: string },
  ): Promise<{ event: string; data: Record<string, unknown> }> {
    const driverId = this.authenticatedDriverId(client)
    if (!driverId) {
      return { event: 'error', data: { message: 'Unauthorized driver' } }
    }
    const offerKey = `offer:${data.orderId}:${driverId}`
    const storedToken = await this.redis.get(offerKey)

    if (!storedToken || storedToken !== data.offerToken) {
      return { event: 'error', data: { message: 'Offer expired or invalid token' } }
    }

    await this.redis.del(offerKey)
    const resolved = this.resolveOffer(data.orderId, driverId, true)
    if (!resolved) {
      return { event: 'error', data: { message: 'Offer already resolved' } }
    }

    return { event: 'dispatch:accepted', data: { orderId: data.orderId } }
  }

  @SubscribeMessage('dispatch:reject')
  async handleReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; offerToken: string },
  ): Promise<{ event: string; data: Record<string, unknown> }> {
    const driverId = this.authenticatedDriverId(client)
    if (!driverId) {
      return { event: 'error', data: { message: 'Unauthorized driver' } }
    }
    const offerKey = `offer:${data.orderId}:${driverId}`
    const storedToken = await this.redis.get(offerKey)

    if (!storedToken || storedToken !== data.offerToken) {
      return { event: 'error', data: { message: 'Offer expired or invalid token' } }
    }

    await this.redis.del(offerKey)
    const resolved = this.resolveOffer(data.orderId, driverId, false)
    if (!resolved) {
      return { event: 'error', data: { message: 'Offer already resolved' } }
    }

    return { event: 'dispatch:rejected', data: { orderId: data.orderId } }
  }

  private authenticatedDriverId(client: Socket): string | null {
    const user = this.socketAuth.getUser(client)
    return user?.role === UserRole.driver ? user.sub : null
  }
}
