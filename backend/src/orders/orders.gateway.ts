import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

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

  @SubscribeMessage('admin:subscribe_drivers')
  handleAdminSubscribe(@ConnectedSocket() client: Socket) {
    client.join('admin:drivers:all')
  }
}
