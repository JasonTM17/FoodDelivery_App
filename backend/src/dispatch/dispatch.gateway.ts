import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets'
import { Inject } from '@nestjs/common'
import { Server } from 'socket.io'
import Redis from 'ioredis'
import { websocketCorsOrigins } from '../common/websocket/websocket-cors'

type OfferCallback = (accepted: boolean) => void

@WebSocketGateway({ namespace: '/dispatch', cors: { origin: websocketCorsOrigins() } })
export class DispatchGateway {
  @WebSocketServer()
  server: Server

  private offerCallbacks = new Map<string, OfferCallback>()

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  sendNewOrderOffer(driverId: string, data: Record<string, unknown>): void {
    this.server.to(`driver:${driverId}`).emit('driver:new_order', data)
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

  broadcastToOrder(orderId: string, event: string, data: Record<string, unknown>): void {
    this.server.to(`order:${orderId}`).emit(event, data)
  }

  emitToAdmins(event: string, data: Record<string, unknown>): void {
    this.server.emit(event, data)
  }

  @SubscribeMessage('dispatch:accept')
  async handleAccept(@MessageBody() data: { orderId: string; driverId: string; offerToken: string }): Promise<{ event: string; data: Record<string, unknown> }> {
    const offerKey = `offer:${data.orderId}:${data.driverId}`
    const storedToken = await this.redis.get(offerKey)

    if (!storedToken || storedToken !== data.offerToken) {
      return { event: 'error', data: { message: 'Offer expired or invalid token' } }
    }

    await this.redis.del(offerKey)
    const resolved = this.resolveOffer(data.orderId, data.driverId, true)
    if (!resolved) {
      return { event: 'error', data: { message: 'Offer already resolved' } }
    }

    return { event: 'dispatch:accepted', data: { orderId: data.orderId } }
  }

  @SubscribeMessage('dispatch:reject')
  async handleReject(@MessageBody() data: { orderId: string; driverId: string; offerToken: string }): Promise<{ event: string; data: Record<string, unknown> }> {
    const offerKey = `offer:${data.orderId}:${data.driverId}`
    const storedToken = await this.redis.get(offerKey)

    if (!storedToken || storedToken !== data.offerToken) {
      return { event: 'error', data: { message: 'Offer expired or invalid token' } }
    }

    await this.redis.del(offerKey)
    const resolved = this.resolveOffer(data.orderId, data.driverId, false)
    if (!resolved) {
      return { event: 'error', data: { message: 'Offer already resolved' } }
    }

    return { event: 'dispatch:rejected', data: { orderId: data.orderId } }
  }
}
