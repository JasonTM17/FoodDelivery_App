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
import { WebSocketAuthService } from '../auth/websocket-auth.service'
import { websocketCorsOrigins } from '../common/websocket/websocket-cors'
import { RealtimeRoomAccessService } from './realtime-room-access.service'

export interface AdminDriverLocationChangedEvent {
  driverId: string
  lat: number
  lng: number
  orderId?: string
  status: 'online' | 'free' | 'delivering' | 'busy'
  timestamp: string
}

@WebSocketGateway({ namespace: '/events', cors: { origin: websocketCorsOrigins() } })
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  constructor(
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

  notifyRestaurant(restaurantId: string, data: Record<string, unknown>) {
    this.server.to(`restaurant:${restaurantId}`).emit('restaurant:new_order', data)
  }

  broadcastToOrder(orderId: string, event: string, data: Record<string, unknown>) {
    this.server.to(`order:${orderId}`).emit(event, data)
  }

  broadcastToRestaurantDriverChat(
    orderId: string,
    event: string,
    data: Record<string, unknown>,
  ) {
    this.server.to(this.restaurantDriverChatRoom(orderId)).emit(event, data)
  }

  notifyAdmins(event: string, data: Record<string, unknown>) {
    this.server.to('admin:orders').emit(event, data)
  }

  notifyAdminDriverLocation(data: AdminDriverLocationChangedEvent) {
    this.server.to('admin:drivers:all').emit('admin:driver_location_changed', data)
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
    if (user.role === UserRole.restaurant || user.role === UserRole.driver) {
      client.join(this.restaurantDriverChatRoom(data.orderId))
    }
    return { success: true }
  }

  @SubscribeMessage('order:unsubscribe')
  handleOrderUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    client.leave(`order:${data.orderId}`)
    client.leave(this.restaurantDriverChatRoom(data.orderId))
  }

  @SubscribeMessage('restaurant:subscribe')
  async handleRestaurantSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string },
  ): Promise<{ success: boolean }> {
    const user = this.socketAuth.getUser(client)
    if (
      !user
      || !data?.restaurantId
      || !(await this.roomAccess.canAccessRestaurant(user, data.restaurantId))
    ) {
      return { success: false }
    }
    client.join(`restaurant:${data.restaurantId}`)
    return { success: true }
  }

  @SubscribeMessage('restaurant:unsubscribe')
  handleRestaurantUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { restaurantId: string }) {
    client.leave(`restaurant:${data.restaurantId}`)
  }

  @SubscribeMessage('admin:subscribe_drivers')
  handleAdminSubscribe(@ConnectedSocket() client: Socket): { success: boolean } {
    const user = this.socketAuth.getUser(client)
    if (user?.role !== UserRole.admin) return { success: false }
    client.join('admin:drivers:all')
    return { success: true }
  }

  @SubscribeMessage('admin:unsubscribe_drivers')
  handleAdminUnsubscribe(@ConnectedSocket() client: Socket) {
    client.leave('admin:drivers:all')
  }

  @SubscribeMessage('admin:subscribe_orders')
  handleAdminOrderSubscribe(@ConnectedSocket() client: Socket): { success: boolean } {
    const user = this.socketAuth.getUser(client)
    if (user?.role !== UserRole.admin) return { success: false }
    client.join('admin:orders')
    return { success: true }
  }

  @SubscribeMessage('admin:unsubscribe_orders')
  handleAdminOrderUnsubscribe(@ConnectedSocket() client: Socket) {
    client.leave('admin:orders')
  }

  private restaurantDriverChatRoom(orderId: string): string {
    return `order:${orderId}:restaurant-driver`
  }
}
