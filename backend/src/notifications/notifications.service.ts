import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger, Optional } from '@nestjs/common'
import { createHash } from 'node:crypto'
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
import {
  fcmRegistrationIdSchema,
  fcmTokenPlatforms,
  type LegacyRegisterFcmTokenInput,
  type RegisterFcmTokenInput,
  type UnregisterFcmTokenInput,
} from './notifications.zod'

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

const FCM_REVOCATION_TTL_MS = 7 * 24 * 60 * 60 * 1000

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

    let releaseDedupKey = true
    try {
      const channels = await this.resolveChannels(userId, eventType)
      if (channels.length === 0) {
        releaseDedupKey = false
        return { sent: false, skipped: true }
      }

      const lang = payload.locale ?? (await this.resolveUserLocale(userId))
      const rendered = this.templateLoader.render(eventType, payload.templateVars ?? {}, lang)
      const isCritical = CRITICAL_EVENTS.has(eventType)

      const effectiveChannels =
        !isCritical && this.isQuietHours()
          ? channels.filter(c => c !== 'push')
          : channels
      if (effectiveChannels.length === 0) {
        releaseDedupKey = false
        return { sent: false, skipped: true }
      }

      const channelData = { ...(payload.data ?? {}), eventType, sourceId: payload.sourceId }
      const channelPayload: ChannelPayload = {
        title: rendered.title,
        body: rendered.body,
        data: channelData,
        critical: isCritical,
      }

      const notification = await this.findOrCreateFanoutAuditRecord({
        userId,
        title: rendered.title,
        body: rendered.body,
        type: eventType,
        payload: channelData,
      }, payload.sourceId)
      channelPayload.notification = this.toRealtimeNotification(notification)

      const results = await Promise.allSettled(
        effectiveChannels.map(ch => this.dispatchChannel(ch, userId, channelPayload)),
      )

      const delivered = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failCount = results.length - delivered
      if (failCount > 0) {
        this.logger.warn(`${failCount}/${results.length} channels failed for userId=${userId} event=${eventType}`)
      }

      // Retain deduplication after any durable channel enqueue/delivery to avoid duplicates.
      releaseDedupKey = delivered === 0
      return {
        sent: failCount === 0,
        attempted: results.length,
        delivered,
        failed: failCount,
      }
    } finally {
      if (releaseDedupKey) {
        await this.releaseFanoutDedupKey(dedupKey)
      }
    }
  }

  private async releaseFanoutDedupKey(dedupKey: string): Promise<void> {
    try {
      await this.redis.del(dedupKey)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(`Notification fanout dedup cleanup failed for ${dedupKey}: ${message}`)
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

  private async findOrCreateFanoutAuditRecord(
    data: {
      userId: string
      title: string
      body: string
      type: string
      payload: Record<string, unknown>
    },
    sourceId: string,
  ) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId: data.userId,
        type: data.type,
        data: { path: ['sourceId'], equals: sourceId },
      },
      orderBy: { createdAt: 'desc' },
    })
    return existing ?? this.insertAuditRecord(data)
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

  async registerFcmToken(userId: string, input: RegisterFcmTokenInput) {
    const { token, platform, deviceId, registrationId } = input
    if (
      !token ||
      token.length < 20 ||
      token.length > 500 ||
      (deviceId != null && (deviceId.length === 0 || deviceId.length > 200)) ||
      !fcmTokenPlatforms.includes(platform) ||
      !fcmRegistrationIdSchema.safeParse(registrationId).success
    ) {
      throw new BadRequestException('INVALID_FCM_TOKEN')
    }
    return this.withFcmTokenLock(token, async tx => {
      const now = new Date()
      await this.removeExpiredFcmRevocations(tx, now)
      const revocation = await tx.fcmTokenRevocation.findUnique({
        where: { registrationId },
      })
      if (revocation != null && revocation.expiresAt > now) {
        return { success: true }
      }
      if (revocation != null) {
        await tx.fcmTokenRevocation.deleteMany({ where: { registrationId } })
      }

      // A registration token identifies an app installation, not an account.
      // Rebinding it on account switch prevents delivery to the previous owner.
      await tx.userFcmToken.upsert({
        where: { token },
        create: {
          userId,
          token,
          platform,
          deviceId,
          registrationId,
          lastSeenAt: now,
        },
        update: {
          userId,
          platform,
          deviceId,
          registrationId,
          lastSeenAt: now,
          isStale: false,
        },
      })
      return { success: true }
    })
  }

  async unregisterFcmToken(userId: string, input: UnregisterFcmTokenInput) {
    return this.unregisterFcmTokenWithDeleteWhere(userId, input, {
      userId,
      token: input.token,
      registrationId: input.registrationId,
    })
  }

  async registerLegacyFcmToken(userId: string, input: LegacyRegisterFcmTokenInput) {
    return this.registerFcmToken(userId, {
      ...input,
      registrationId: this.legacyFcmRegistrationId(userId, input.token),
    })
  }

  async unregisterLegacyFcmToken(userId: string, token: string) {
    const registrationId = this.legacyFcmRegistrationId(userId, token)
    return this.unregisterFcmTokenWithDeleteWhere(userId, {
      token,
      registrationId,
    }, {
      userId,
      token,
      OR: [
        { registrationId },
        { registrationId: null },
      ],
    })
  }

  private async unregisterFcmTokenWithDeleteWhere(
    userId: string,
    input: UnregisterFcmTokenInput,
    deleteWhere: Prisma.UserFcmTokenWhereInput,
  ) {
    const { token, registrationId } = input
    if (
      !token ||
      token.length < 20 ||
      token.length > 500 ||
      !fcmRegistrationIdSchema.safeParse(registrationId).success
    ) {
      throw new BadRequestException('INVALID_FCM_TOKEN')
    }
    return this.withFcmTokenLock(token, async tx => {
      const now = new Date()
      await this.removeExpiredFcmRevocations(tx, now)
      await tx.fcmTokenRevocation.upsert({
        where: { registrationId },
        create: {
          registrationId,
          token,
          expiresAt: new Date(now.getTime() + FCM_REVOCATION_TTL_MS),
        },
        update: {
          token,
          expiresAt: new Date(now.getTime() + FCM_REVOCATION_TTL_MS),
        },
      })
      await tx.userFcmToken.deleteMany({
        where: deleteWhere,
      })
      return { success: true }
    })
  }

  private legacyFcmRegistrationId(userId: string, token: string): string {
    const hash = createHash('sha256').update(`${userId}:${token}`).digest('hex')
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`
  }

  private async removeExpiredFcmRevocations(
    tx: Prisma.TransactionClient,
    now: Date,
  ): Promise<void> {
    await tx.fcmTokenRevocation.deleteMany({
      where: { expiresAt: { lte: now } },
    })
  }

  private async withFcmTokenLock<T>(
    token: string,
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${token}, 0))`
      return operation(tx)
    })
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
