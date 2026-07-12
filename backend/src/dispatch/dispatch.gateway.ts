import {
  ConnectedSocket,
  OnGatewayInit,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { UserRole } from '@prisma/client'
import { Server } from 'socket.io'
import type { Socket } from 'socket.io'
import { WebSocketAuthService } from '../auth/websocket-auth.service'
import { websocketCorsOrigins } from '../common/websocket/websocket-cors'
import { DispatchOfferService } from './dispatch-offer.service'
import { DispatchNotifierService } from './dispatch-notifier.service'

@WebSocketGateway({ namespace: '/dispatch', cors: { origin: websocketCorsOrigins() } })
export class DispatchGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  server: Server

  constructor(
    private readonly socketAuth: WebSocketAuthService,
    private readonly offers: DispatchOfferService,
    private readonly notifier: DispatchNotifierService,
  ) {}

  afterInit(server: Server): void {
    this.notifier.attachSocketServer(server)
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.socketAuth.authenticate(client)
      if (user.role !== UserRole.driver) {
        client.disconnect(true)
        return
      }
      client.join(`driver:${user.sub}`)
      client.emit('auth:ready')
    } catch {
      client.disconnect(true)
    }
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
    try {
      await this.offers.respondToOffer(data.orderId, driverId, data.offerToken, 'accept')
      return { event: 'dispatch:accepted', data: { orderId: data.orderId } }
    } catch {
      return { event: 'error', data: { message: 'Offer expired or already resolved' } }
    }
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
    try {
      await this.offers.respondToOffer(data.orderId, driverId, data.offerToken, 'reject')
      return { event: 'dispatch:rejected', data: { orderId: data.orderId } }
    } catch {
      return { event: 'error', data: { message: 'Offer expired or already resolved' } }
    }
  }

  private authenticatedDriverId(client: Socket): string | null {
    const user = this.socketAuth.getUser(client)
    return user?.role === UserRole.driver ? user.sub : null
  }
}
