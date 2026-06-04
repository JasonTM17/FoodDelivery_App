import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsService } from './notifications.service'
import { PrismaService } from '../database/prisma.service'

describe('NotificationsService', () => {
  let service: NotificationsService

  const mockPrisma = {
    notification: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get(NotificationsService)
  })

  describe('getUserNotifications', () => {
    it('returns empty list with unread count', async () => {
      const result = await service.getUserNotifications('u1')
      expect(result.notifications).toEqual([])
      expect(result.unreadCount).toBe(0)
    })
  })

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      await service.markAsRead('n1', 'u1')
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'n1', userId: 'u1' }, data: { isRead: true },
      })
    })
  })
})
