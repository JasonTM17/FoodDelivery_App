import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

type OfferCallback = (accepted: boolean) => void

@WebSocketGateway({ namespace: '/dispatch', cors: { origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'] } })
export class DispatchGateway {
  @WebSocketServer()
  server: Server

  private offerCallbacks = new Map<string, OfferCallback>()

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
}
