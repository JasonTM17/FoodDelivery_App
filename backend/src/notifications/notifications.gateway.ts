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
import { JwtService } from '@nestjs/jwt'
import { Logger } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtPayload } from '../auth/jwt-payload.interface'

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'] },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(NotificationsGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '')

      if (!token) {
        this.logger.warn(`WebSocket connection rejected: no token (socket ${client.id})`)
        client.disconnect(true)
        return
      }

      const payload: JwtPayload = this.jwtService.verify(token)
      client.data.user = { sub: payload.sub, role: payload.role }

      // Join user-specific notification room
      const room = `user:${payload.sub}:notifications`
      client.join(room)

      this.logger.log(`User ${payload.sub} connected to notifications (socket ${client.id})`)
    } catch (err) {
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
