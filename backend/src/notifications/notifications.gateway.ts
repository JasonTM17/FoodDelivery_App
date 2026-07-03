import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { forwardRef, Inject, Logger } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { WebSocketAuthService } from '../auth/websocket-auth.service'
import { websocketCorsOrigins } from '../common/websocket/websocket-cors'

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: websocketCorsOrigins() },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(NotificationsGateway.name)

  constructor(
    private readonly socketAuth: WebSocketAuthService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.socketAuth.authenticate(client)

      // Join user-specific notification room
      const room = `user:${user.sub}:notifications`
      client.join(room)

      this.logger.log(`User ${user.sub} connected to notifications (socket ${client.id})`)
    } catch {
      this.logger.warn(`WebSocket connection rejected: invalid token (socket ${client.id})`)
      client.disconnect(true)
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.user?.sub
    if (userId) {
      const room = `user:${userId}:notifications`
      client.leave(room)
      this.logger.log(`User ${userId} disconnected from notifications (socket ${client.id})`)
    }
  }

  /** Push a notification to a specific user in real time. */
  sendToUser(userId: string, notification: Record<string, unknown>): void {
    const room = `user:${userId}:notifications`
    this.server.to(room).emit('notification:new', notification)
  }

  @SubscribeMessage('notifications:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ): Promise<{ success: boolean }> {
    const userId = client.data?.user?.sub
    if (!userId || !data?.notificationId) {
      return { success: false }
    }

    await this.notificationsService.markAsRead(data.notificationId, userId)
    return { success: true }
  }

  @SubscribeMessage('notifications:read_all')
  async handleMarkAllAsRead(
    @ConnectedSocket() client: Socket,
  ): Promise<{ success: boolean }> {
    const userId = client.data?.user?.sub
    if (!userId) {
      return { success: false }
    }

    await this.notificationsService.markAllAsRead(userId)
    return { success: true }
  }
}
