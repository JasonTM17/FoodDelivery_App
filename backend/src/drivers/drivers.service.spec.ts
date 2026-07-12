import { Test, TestingModule } from '@nestjs/testing'
import { DriversService } from './drivers.service'
import { PrismaService } from '../database/prisma.service'
import { BadRequestException } from '@nestjs/common'

describe('DriversService', () => {
  let service: DriversService

  const pipeline = {
    geoadd: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setex: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }

  const mockRedis = {
    geoadd: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    zrem: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    multi: jest.fn(() => pipeline),
  }
  const mockPrisma = {
    driverProfile: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    order: { findFirst: jest.fn(), findMany: jest.fn() },
    payoutLedger: { findMany: jest.fn() },
    payment: { findMany: jest.fn() },
    review: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    mockRedis.get.mockResolvedValue(null)
    mockRedis.multi.mockReturnValue(pipeline)
    pipeline.exec.mockResolvedValue([])
    mockPrisma.order.findFirst.mockResolvedValue(null)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile()
    service = module.get(DriversService)
  })

  describe('goOnline', () => {
    it('rejects driver online coordinates outside the Vietnam delivery bounds', async () => {
      await expect(service.goOnline('d1', 13.7563, 100.5018)).rejects.toThrow(
        new BadRequestException('LOCATION_OUT_OF_DELIVERY_AREA'),
      )
      expect(mockPrisma.driverProfile.findUniqueOrThrow).not.toHaveBeenCalled()
      expect(mockRedis.multi).not.toHaveBeenCalled()
    })

    it('throws if driver not verified', async () => {
      mockPrisma.driverProfile.findUniqueOrThrow.mockResolvedValueOnce({
        isVerified: false,
        rating: '4.0',
        totalDeliveries: 0,
      })
      await expect(service.goOnline('d1', 10.8, 106.7)).rejects.toThrow(BadRequestException)
    })

    it('adds driver to Redis GEO and sets status online when idle', async () => {
      mockPrisma.driverProfile.findUniqueOrThrow.mockResolvedValueOnce({
        isVerified: true,
        rating: '4.5',
        totalDeliveries: 37,
      })
      mockPrisma.driverProfile.update.mockResolvedValueOnce({})
      await expect(service.goOnline('d1', 10.8, 106.7)).resolves.toEqual({
        isOnline: true,
        lat: 10.8,
        lng: 106.7,
      })
      expect(mockRedis.multi).toHaveBeenCalled()
      expect(pipeline.geoadd).toHaveBeenCalled()
      expect(pipeline.set).toHaveBeenCalledWith('driver:d1:status', 'online')
      expect(pipeline.set).toHaveBeenCalledWith('driver:d1:rating', '4.5')
      expect(pipeline.set).toHaveBeenCalledWith('driver:d1:total_deliveries', '37')
      expect(pipeline.set).toHaveBeenCalledWith(
        'driver:d1:idle_since',
        expect.stringMatching(/^\d+$/),
      )
      expect(pipeline.set).toHaveBeenCalledWith('driver:d1:current_order', '')
      expect(pipeline.setex).toHaveBeenCalledWith(
        'driver:d1:last_seen_at',
        35,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      )
    })

    it('preserves in-progress current_order and marks busy (B-DRV-01)', async () => {
      mockPrisma.driverProfile.findUniqueOrThrow.mockResolvedValueOnce({
        isVerified: true,
        rating: '4.9',
        totalDeliveries: 10,
      })
      mockPrisma.order.findFirst.mockResolvedValueOnce({ id: 'order-active-1' })
      mockPrisma.driverProfile.update.mockResolvedValueOnce({})

      await service.goOnline('d1', 10.8, 106.7)

      expect(pipeline.set).toHaveBeenCalledWith('driver:d1:status', 'busy')
      expect(pipeline.set).toHaveBeenCalledWith('driver:d1:current_order', 'order-active-1')
      expect(pipeline.del).toHaveBeenCalledWith('driver:d1:idle_since')
      // Must not wipe trip to empty string
      expect(pipeline.set).not.toHaveBeenCalledWith('driver:d1:current_order', '')
    })

    it('preserves redis current_order when DB has no active order but redis does', async () => {
      mockPrisma.driverProfile.findUniqueOrThrow.mockResolvedValueOnce({
        isVerified: true,
        rating: '4.0',
        totalDeliveries: 1,
      })
      mockPrisma.order.findFirst.mockResolvedValueOnce(null)
      mockRedis.get.mockResolvedValueOnce('order-from-redis')
      mockPrisma.driverProfile.update.mockResolvedValueOnce({})

      await service.goOnline('d1', 10.8, 106.7)

      expect(pipeline.set).toHaveBeenCalledWith('driver:d1:status', 'busy')
      expect(pipeline.set).toHaveBeenCalledWith('driver:d1:current_order', 'order-from-redis')
    })
  })

  describe('getEarnings', () => {
    it('returns real driver payout ledger totals and entries', async () => {
      const completedAt = new Date('2026-07-03T08:30:00Z')
      mockPrisma.payoutLedger.findMany.mockResolvedValueOnce([
        {
          orderId: 'order-1',
          amount: 25000,
          createdAt: new Date('2026-07-03T08:31:00Z'),
          order: {
            orderCode: 'FD0000000001',
            restaurant: { name: 'FoodFlow Kitchen' },
            deliveryTask: { deliveredAt: completedAt },
          },
        },
        {
          orderId: 'order-2',
          amount: 15000,
          createdAt: new Date('2026-07-03T08:00:00Z'),
          order: {
            orderCode: 'FD0000000002',
            restaurant: { name: 'Noodle House' },
            deliveryTask: null,
          },
        },
      ])

      const result = await service.getEarnings('driver-1', 'today')

      expect(mockPrisma.payoutLedger.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          recipientType: 'driver',
          recipientId: 'driver-1',
        }),
      }))
      expect(result).toEqual({
        totalEarnings: 40000,
        totalOrders: 2,
        averagePerOrder: 20000,
        entries: [
          {
            orderId: 'order-1',
            orderCode: 'FD0000000001',
            restaurantName: 'FoodFlow Kitchen',
            amount: 25000,
            completedAt: completedAt.toISOString(),
          },
          {
            orderId: 'order-2',
            orderCode: 'FD0000000002',
            restaurantName: 'Noodle House',
            amount: 15000,
            completedAt: new Date('2026-07-03T08:00:00Z').toISOString(),
          },
        ],
      })
    })
  })
})
