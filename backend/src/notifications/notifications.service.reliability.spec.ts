import { NotificationsService } from './notifications.service'
import { PrismaService } from '../database/prisma.service'
import { TemplateLoader } from './templates/template.loader'
import { InAppChannel } from './channels/in-app.channel'
import { FcmChannel } from './channels/fcm.channel'
import { SmtpChannel } from './channels/smtp.channel'
import { TwilioChannel } from './channels/twilio.channel'

const userId = 'user-123'
const eventType = 'order_accepted'
const payload = { sourceId: 'order-abc', locale: 'vi' as const }

function createService() {
  const prisma = {
    notification: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'notification-1',
        title: 'title',
        body: 'body',
        type: eventType,
        data: {},
        isRead: false,
        createdAt: new Date('2026-07-13T00:00:00.000Z'),
      }),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  }
  const redis = { set: jest.fn().mockResolvedValue('OK'), del: jest.fn() }
  const templateLoader = { render: jest.fn().mockReturnValue({ title: 'title', body: 'body' }) }
  const inApp = { send: jest.fn().mockResolvedValue({ success: true }) }
  const fcm = { send: jest.fn().mockResolvedValue({ success: true }) }
  const smtp = { send: jest.fn().mockResolvedValue({ success: true }) }
  const twilio = { send: jest.fn().mockResolvedValue({ success: true }) }

  const service = new NotificationsService(
    prisma as unknown as PrismaService,
    redis as never,
    templateLoader as unknown as TemplateLoader,
    inApp as unknown as InAppChannel,
    fcm as unknown as FcmChannel,
    smtp as unknown as SmtpChannel,
    twilio as unknown as TwilioChannel,
  )

  return { service, prisma, redis, templateLoader, inApp, fcm }
}

describe('NotificationsService fanout reliability', () => {
  const dedupKey = `dedup:${userId}:${eventType}:${payload.sourceId}`

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('releases fanout deduplication when rendering fails before delivery', async () => {
    const { service, redis, templateLoader } = createService()
    templateLoader.render.mockImplementation(() => {
      throw new Error('template unavailable')
    })

    await expect(service.fanout(userId, eventType, payload)).rejects.toThrow('template unavailable')

    expect(redis.del).toHaveBeenCalledWith(dedupKey)
  })

  it('releases fanout deduplication when the audit insert fails before delivery', async () => {
    const { service, prisma, redis } = createService()
    prisma.notification.create.mockRejectedValue(new Error('database unavailable'))
    jest.spyOn(Date.prototype, 'getUTCHours').mockReturnValue(5)

    await expect(service.fanout(userId, eventType, payload)).rejects.toThrow('database unavailable')

    expect(redis.del).toHaveBeenCalledWith(dedupKey)
  })

  it('releases a failed fanout so an immediate retry can enqueue delivery', async () => {
    const { service, prisma, redis, inApp, fcm } = createService()
    prisma.notification.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'notification-1',
        title: 'title',
        body: 'body',
        type: eventType,
        data: { eventType, sourceId: payload.sourceId },
        isRead: false,
        createdAt: new Date('2026-07-13T00:00:00.000Z'),
      })
    inApp.send.mockResolvedValueOnce({ success: false, error: 'gateway unavailable' })
    fcm.send.mockRejectedValueOnce(new Error('queue unavailable'))
    jest.spyOn(Date.prototype, 'getUTCHours').mockReturnValue(5)

    const failed = await service.fanout(userId, eventType, payload)
    const retried = await service.fanout(userId, eventType, payload)

    expect(failed).toEqual({ sent: false, attempted: 2, delivered: 0, failed: 2 })
    expect(redis.del).toHaveBeenCalledWith(dedupKey)
    expect(retried).toEqual({ sent: true, attempted: 2, delivered: 2, failed: 0 })
    expect(redis.set).toHaveBeenCalledTimes(2)
    expect(prisma.notification.create).toHaveBeenCalledTimes(1)
  })
})
