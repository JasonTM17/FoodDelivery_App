import { Injectable, Optional } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { Prisma } from '@prisma/client'
import { NotificationsGateway } from './notifications.gateway'

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly gateway?: NotificationsGateway,
  ) {}

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ])
    return { notifications, unreadCount, meta: { page, limit, total } }
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  async create(data: { userId: string; title: string; body: string; type: string; payload?: Record<string, unknown> }) {
    const notification = await this.prisma.notification.create({
      data: { userId: data.userId, title: data.title, body: data.body, type: data.type, data: (data.payload ?? {}) as Prisma.InputJsonValue },
    })

    // Push real-time notification via WebSocket
    this.gateway?.sendToUser(data.userId, {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    })

    return notification
  }
}
