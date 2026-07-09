import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsService } from './notifications.service'
import { PrismaService } from '../database/prisma.service'
import { TemplateLoader } from './templates/template.loader'
import { InAppChannel } from './channels/in-app.channel'
import { FcmChannel } from './channels/fcm.channel'
import { SmtpChannel } from './channels/smtp.channel'
import { TwilioChannel } from './channels/twilio.channel'

const mockPrisma = {
  notification: {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    create: jest.fn().mockResolvedValue({ id: 'n1', title: 't', body: 'b', type: 'order_accepted', data: {}, isRead: false, createdAt: new Date() }),
  },
  $queryRaw: jest.fn().mockResolvedValue([]),
}

const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
}

const mockTemplateLoader = {
  render: jest.fn().mockReturnValue({ title: 'Đơn hàng được xác nhận', body: 'Nội dung', critical: false, supportedChannels: ['in_app', 'push'] }),
}

const mockInApp  = { name: 'in_app', send: jest.fn().mockResolvedValue({ success: true }) }
const mockFcm    = { name: 'push',   send: jest.fn().mockResolvedValue({ success: true }) }
const mockSmtp   = { name: 'email',  send: jest.fn().mockResolvedValue({ success: true }) }
const mockTwilio = { name: 'sms',    send: jest.fn().mockResolvedValue({ success: true }) }

describe('NotificationsService', () => {
  let service: NotificationsService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService,    useValue: mockPrisma },
        { provide: 'REDIS_CLIENT',   useValue: mockRedis },
        { provide: TemplateLoader,   useValue: mockTemplateLoader },
        { provide: InAppChannel,     useValue: mockInApp },
        { provide: FcmChannel,       useValue: mockFcm },
        { provide: SmtpChannel,      useValue: mockSmtp },
        { provide: TwilioChannel,    useValue: mockTwilio },
      ],
    }).compile()

    service = module.get(NotificationsService)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getUserNotifications', () => {
    it('returns paginated list with unread count', async () => {
      const result = await service.getUserNotifications('u1')
      expect(result.notifications).toEqual([])
      expect(result.unreadCount).toBe(0)
      expect(result.meta).toMatchObject({ page: 1, limit: 20 })
    })
  })

  describe('markAsRead', () => {
    it('updates isRead for the correct user + notification', async () => {
      await service.markAsRead('n1', 'u1')
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'n1', userId: 'u1' },
        data: { isRead: true },
      })
    })
  })

  describe('markAllAsRead', () => {
    it('marks all unread notifications for a user', async () => {
      await service.markAllAsRead('u1')
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isRead: false },
        data: { isRead: true },
      })
    })
  })

  describe('fanout', () => {
    const userId = 'user-123'
    const eventType = 'order_accepted'
    const payload = { sourceId: 'order-abc', templateVars: { orderCode: 'ABC001' } }

    it('sends to in_app and push channels by default', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw.mockResolvedValueOnce([])
      const dateSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12)

      const result = await service.fanout(userId, eventType, payload)

      expect(result).toEqual({ sent: true, attempted: 2, delivered: 2, failed: 0 })
      expect(mockInApp.send).toHaveBeenCalledWith(userId, expect.objectContaining({ title: expect.any(String) }))
      expect(mockFcm.send).toHaveBeenCalledWith(userId, expect.objectContaining({ title: expect.any(String) }))
      expect(mockPrisma.notification.create).toHaveBeenCalled()
      dateSpy.mockRestore()
    })

    it('sends canonical persisted notification rows over in-app realtime', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw.mockResolvedValueOnce([])
      const dateSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12)

      await service.fanout(userId, eventType, payload)

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: eventType,
          data: expect.objectContaining({ eventType }),
        }),
      })
      expect(mockInApp.send).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          notification: expect.objectContaining({
            id: 'n1',
            title: 't',
            body: 'b',
            type: 'order_accepted',
            data: {},
            isRead: false,
            createdAt: expect.any(String),
          }),
        }),
      )
      dateSpy.mockRestore()
    })

    it('skips on dedup (redis.set returns null)', async () => {
      mockRedis.set.mockResolvedValueOnce(null)

      const result = await service.fanout(userId, eventType, payload)

      expect(result).toEqual({ sent: false, skipped: true })
      expect(mockInApp.send).not.toHaveBeenCalled()
      expect(mockPrisma.notification.create).not.toHaveBeenCalled()
    })

    it('mutes push channel during quiet hours for non-critical events', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw.mockResolvedValueOnce([])

      const dateSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(23)

      await service.fanout(userId, eventType, payload)

      expect(mockFcm.send).not.toHaveBeenCalled()
      expect(mockInApp.send).toHaveBeenCalled()

      dateSpy.mockRestore()
    })

    it('keeps push for critical events during quiet hours', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw.mockResolvedValueOnce([])

      const dateSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(23)

      await service.fanout(userId, 'cancelled', { sourceId: 'order-x' })

      expect(mockFcm.send).toHaveBeenCalled()

      dateSpy.mockRestore()
    })

    it('respects user preferences from notification_settings', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ channels: ['in_app'], enabled: true }])

      await service.fanout(userId, eventType, payload)

      expect(mockInApp.send).toHaveBeenCalled()
      expect(mockFcm.send).not.toHaveBeenCalled()
    })

    it('skips all channels when user has disabled the event', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ channels: ['in_app', 'push'], enabled: false }])

      const result = await service.fanout(userId, eventType, payload)

      expect(result).toEqual({ sent: false, skipped: true })
      expect(mockInApp.send).not.toHaveBeenCalled()
    })

    it('reports partial channel failure instead of marking the fanout as sent', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw.mockResolvedValueOnce([])
      const dateSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12)
      mockFcm.send.mockRejectedValueOnce(new Error('FCM unavailable'))

      const result = await service.fanout(userId, eventType, payload)

      expect(result).toEqual({ sent: false, attempted: 2, delivered: 1, failed: 1 })
      expect(mockPrisma.notification.create).toHaveBeenCalled()
      dateSpy.mockRestore()
    })

    it('treats channel success=false results as failed delivery', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw.mockResolvedValueOnce([])
      const dateSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12)
      mockFcm.send.mockResolvedValueOnce({ success: false, error: 'queue unavailable' })

      const result = await service.fanout(userId, eventType, payload)

      expect(result).toEqual({ sent: false, attempted: 2, delivered: 1, failed: 1 })
      expect(mockPrisma.notification.create).toHaveBeenCalled()
      dateSpy.mockRestore()
    })

    it('fails closed when notification settings lookup fails instead of using default channels', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('settings table unavailable'))

      await expect(service.fanout(userId, eventType, payload)).rejects.toThrow('NOTIFICATION_SETTINGS_UNAVAILABLE')

      expect(mockInApp.send).not.toHaveBeenCalled()
      expect(mockFcm.send).not.toHaveBeenCalled()
      expect(mockPrisma.notification.create).not.toHaveBeenCalled()
    })

    it('fails closed when locale lookup fails instead of rendering Vietnamese fallback copy', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('users table unavailable'))

      await expect(service.fanout(userId, eventType, payload)).rejects.toThrow('NOTIFICATION_LOCALE_UNAVAILABLE')

      expect(mockTemplateLoader.render).not.toHaveBeenCalled()
      expect(mockPrisma.notification.create).not.toHaveBeenCalled()
    })
  })
})
