import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

export interface AdminDriverLocationChangedEvent {
  driverId: string
  lat: number
  lng: number
  orderId?: string
  status: 'online' | 'free' | 'delivering' | 'busy'
  timestamp: string
}

@WebSocketGateway({ namespace: '/events', cors: { origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'] } })
export class OrdersGateway {
  @WebSocketServer()
  server: Server

  notifyRestaurant(restaurantId: string, data: Record<string, unknown>) {
    this.server.to(`restaurant:${restaurantId}`).emit('restaurant:new_order', data)
  }

  broadcastToOrder(orderId: string, event: string, data: Record<string, unknown>) {
    this.server.to(`order:${orderId}`).emit(event, data)
  }

  notifyAdmins(event: string, data: Record<string, unknown>) {
    this.server.to('admin:orders').emit(event, data)
  }

  notifyAdminDriverLocation(data: AdminDriverLocationChangedEvent) {
    this.server.to('admin:drivers:all').emit('admin:driver_location_changed', data)
  }

  @SubscribeMessage('order:subscribe')
  handleOrderSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    client.join(`order:${data.orderId}`)
  }

  @SubscribeMessage('order:unsubscribe')
  handleOrderUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    client.leave(`order:${data.orderId}`)
  }

  @SubscribeMessage('restaurant:subscribe')
  handleRestaurantSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { restaurantId: string }) {
    client.join(`restaurant:${data.restaurantId}`)
  }

  @SubscribeMessage('restaurant:unsubscribe')
  handleRestaurantUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { restaurantId: string }) {
    client.leave(`restaurant:${data.restaurantId}`)
  }

  @SubscribeMessage('admin:subscribe_drivers')
  handleAdminSubscribe(@ConnectedSocket() client: Socket) {
    client.join('admin:drivers:all')
  }

  @SubscribeMessage('admin:unsubscribe_drivers')
  handleAdminUnsubscribe(@ConnectedSocket() client: Socket) {
    client.leave('admin:drivers:all')
  }

  @SubscribeMessage('admin:subscribe_orders')
  handleAdminOrderSubscribe(@ConnectedSocket() client: Socket) {
    client.join('admin:orders')
  }

  @SubscribeMessage('admin:unsubscribe_orders')
  handleAdminOrderUnsubscribe(@ConnectedSocket() client: Socket) {
    client.leave('admin:orders')
  }
}
