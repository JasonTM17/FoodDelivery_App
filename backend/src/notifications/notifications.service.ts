import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger, Optional } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { Prisma, type Notification } from '@prisma/client'
import Redis from 'ioredis'
import { NotificationsGateway } from './notifications.gateway'
import { InAppChannel } from './channels/in-app.channel'
import { FcmChannel } from './channels/fcm.channel'
import { SmtpChannel } from './channels/smtp.channel'
import { TwilioChannel } from './channels/twilio.channel'
import { TemplateLoader, type Locale } from './templates/template.loader'
import {
  CRITICAL_EVENTS,
  DEFAULT_CHANNELS,
  DEDUP_TTL_SECONDS,
  QUIET_HOUR_START,
  QUIET_HOUR_END,
} from './notifications.constants'
import type { ChannelPayload, ChannelResult } from './channels/notification-channel.interface'

export interface FanoutPayload {
  sourceId: string
  templateVars?: Record<string, string>
  data?: Record<string, unknown>
  locale?: Locale
}

interface NotificationSettingRow {
  channels: string[]
  enabled: boolean
}

type RealtimeNotification = Pick<Notification, 'id' | 'title' | 'body' | 'type' | 'data' | 'isRead' | 'createdAt'>
interface FanoutResult {
  sent: boolean
  skipped?: boolean
  attempted?: number
  delivered?: number
  failed?: number
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly templateLoader: TemplateLoader,
    @Inject(forwardRef(() => InAppChannel)) private readonly inApp: InAppChannel,
    private readonly fcm: FcmChannel,
    private readonly smtp: SmtpChannel,
    private readonly twilio: TwilioChannel,
    @Optional()
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway?: NotificationsGateway,
  ) {}

  async fanout(
    userId: string,
    eventType: string,
    payload: FanoutPayload,
  ): Promise<FanoutResult> {
    const dedupKey = `dedup:${userId}:${eventType}:${payload.sourceId}`
    const acquired = await this.redis.set(dedupKey, '1', 'EX', DEDUP_TTL_SECONDS, 'NX')
    if (acquired === null) {
      this.logger.log(`Dedup skip: ${eventType} userId=${userId} sourceId=${payload.sourceId}`)
      return { sent: false, skipped: true }
    }

    const channels = await this.resolveChannels(userId, eventType)
    if (channels.length === 0) return { sent: false, skipped: true }

    const lang = payload.locale ?? (await this.resolveUserLocale(userId))
    const rendered = this.templateLoader.render(eventType, payload.templateVars ?? {}, lang)
    const isCritical = CRITICAL_EVENTS.has(eventType)

    const effectiveChannels =
      !isCritical && this.isQuietHours()
        ? channels.filter(c => c !== 'push')
        : channels
    if (effectiveChannels.length === 0) return { sent: false, skipped: true }

    const channelPayload: ChannelPayload = {
      title: rendered.title,
      body: rendered.body,
      data: { ...(payload.data ?? {}), eventType },
      critical: isCritical,
    }

    const notification = await this.insertAuditRecord({
      userId,
      title: rendered.title,
      body: rendered.body,
      type: eventType,
      payload: channelPayload.data,
    })
    channelPayload.notification = this.toRealtimeNotification(notification)

    const results = await Promise.allSettled(
      effectiveChannels.map(ch => this.dispatchChannel(ch, userId, channelPayload)),
    )

    const delivered = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failCount = results.length - delivered
    if (failCount > 0) {
      this.logger.warn(`${failCount}/${results.length} channels failed for userId=${userId} event=${eventType}`)
    }

    return {
      sent: failCount === 0,
      attempted: results.length,
      delivered,
      failed: failCount,
    }
  }

  private async dispatchChannel(channel: string, userId: string, payload: ChannelPayload): Promise<ChannelResult> {
    switch (channel) {
      case 'in_app': return this.inApp.send(userId, payload)
      case 'push':   return this.fcm.send(userId, payload)
      case 'email':  return this.smtp.send(userId, payload)
      case 'sms':    return this.twilio.send(userId, payload)
      default:
        this.logger.warn(`Unknown channel: ${channel}`)
        return { success: false, error: `UNKNOWN_CHANNEL:${channel}` }
    }
  }

  private async resolveChannels(userId: string, eventType: string): Promise<string[]> {
    try {
      const rows = await this.prisma.$queryRaw<NotificationSettingRow[]>`
        SELECT channels, enabled FROM notification_settings
        WHERE user_id = ${userId}::uuid AND event_type = ${eventType}
        LIMIT 1
      `
      if (rows.length > 0) {
        return rows[0].enabled ? (rows[0].channels as string[]) : []
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(`Notification settings lookup failed for userId=${userId} event=${eventType}: ${message}`)
      throw new InternalServerErrorException('NOTIFICATION_SETTINGS_UNAVAILABLE')
    }
    return DEFAULT_CHANNELS[eventType] ?? ['in_app']
  }

  private async resolveUserLocale(userId: string): Promise<Locale> {
    try {
      const rows = await this.prisma.$queryRaw<{ preferred_locale: string }[]>`
        SELECT preferred_locale FROM users WHERE id = ${userId}::uuid LIMIT 1
      `
      const value = rows[0]?.preferred_locale
      if (value === 'en' || value === 'ja') return value
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(`Notification locale lookup failed for userId=${userId}: ${message}`)
      throw new InternalServerErrorException('NOTIFICATION_LOCALE_UNAVAILABLE')
    }
    return 'vi'
  }

  private isQuietHours(): boolean {
    const h = (new Date().getUTCHours() + 7) % 24
    return h >= QUIET_HOUR_START || h < QUIET_HOUR_END
  }

  private async insertAuditRecord(data: {
    userId: string; title: string; body: string; type: string; payload?: Record<string, unknown>
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        data: (data.payload ?? {}) as Prisma.InputJsonValue,
      },
    })
  }

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

  async registerFcmToken(userId: string, token: string, platform: 'ios' | 'android' | 'web', deviceId?: string) {
    if (!token || token.length < 20) throw new BadRequestException('INVALID_FCM_TOKEN')
    await this.prisma.userFcmToken.upsert({
      where: { token },
      create: { userId, token, platform, deviceId, lastSeenAt: new Date() },
      update: { userId, platform, deviceId, lastSeenAt: new Date(), isStale: false },
    })
    return { success: true }
  }

  async unregisterFcmToken(userId: string, token: string) {
    await this.prisma.userFcmToken.deleteMany({ where: { userId, token } })
    return { success: true }
  }

  async create(data: {
    userId: string; title: string; body: string; type: string; payload?: Record<string, unknown>
  }) {
    const notification = await this.insertAuditRecord(data)
    this.gateway?.sendToUser(data.userId, this.toRealtimeNotification(notification))
    return notification
  }

  private toRealtimeNotification(notification: RealtimeNotification) {
    return {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data ?? {},
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    }
  }
}
