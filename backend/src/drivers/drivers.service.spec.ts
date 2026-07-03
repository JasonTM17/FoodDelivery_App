import { Test, TestingModule } from '@nestjs/testing'
import { DriversService } from './drivers.service'
import { PrismaService } from '../database/prisma.service'
import { BadRequestException } from '@nestjs/common'

describe('DriversService', () => {
  let service: DriversService
  const mockRedis = {
    geoadd: jest.fn(), set: jest.fn(), setex: jest.fn(), del: jest.fn(), zrem: jest.fn(),
  }
  const mockPrisma = {
    driverProfile: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    payment: { findMany: jest.fn() },
    review: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
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
    it('throws if driver not verified', async () => {
      mockPrisma.driverProfile.findUniqueOrThrow.mockResolvedValueOnce({ isVerified: false, rating: '4.0' })
      await expect(service.goOnline('d1', 10.8, 106.7)).rejects.toThrow(BadRequestException)
    })

    it('adds driver to Redis GEO and sets status', async () => {
      mockPrisma.driverProfile.findUniqueOrThrow.mockResolvedValueOnce({ isVerified: true, rating: '4.5' })
      mockPrisma.driverProfile.update.mockResolvedValueOnce({})
      await service.goOnline('d1', 10.8, 106.7)
      expect(mockRedis.geoadd).toHaveBeenCalled()
      expect(mockRedis.set).toHaveBeenCalledWith('driver:d1:status', 'online')
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'driver:d1:last_seen_at',
        35,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      )
    })
  })

  describe('getHeatmap', () => {
    it('rejects invalid coordinates without querying demand data', async () => {
      await expect(service.getHeatmap({ lat: 999, lng: 106.7 })).rejects.toThrow(BadRequestException)
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled()
    })

    it('returns real demand rows with derived demand levels', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { lat: 10.78, lng: 106.7, orderCount: 12, avgPayout: 32500.4 },
        { lat: 10.8, lng: 106.72, orderCount: 4, avgPayout: 22000 },
        { lat: 10.81, lng: 106.73, orderCount: 1, avgPayout: 18000 },
      ])

      const points = await service.getHeatmap({ lat: 10.7769, lng: 106.7009, radiusKm: 5, window: '1h' })

      expect(mockPrisma.$queryRaw).toHaveBeenCalled()
      expect(points).toEqual([
        { lat: 10.78, lng: 106.7, orderCount: 12, avgPayout: 32500, demandLevel: 2 },
        { lat: 10.8, lng: 106.72, orderCount: 4, avgPayout: 22000, demandLevel: 1 },
        { lat: 10.81, lng: 106.73, orderCount: 1, avgPayout: 18000, demandLevel: 0 },
      ])
    })
  })

  describe('getEarningsSummary', () => {
    it('builds a continuous 7 day summary from driver payout ledger rows', async () => {
      const today = dateKey(new Date())
      const yesterday = dateKey(addDays(new Date(), -1))
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { date: yesterday, amount: 40000, tripCount: 2 },
        { date: today, amount: 30000, tripCount: 1 },
      ])

      const summary = await service.getEarningsSummary('d1', '7d')

      expect(mockPrisma.$queryRaw).toHaveBeenCalled()
      expect(summary.period).toBe('7d')
      expect(summary.byDay).toHaveLength(7)
      expect(summary.totalVnd).toBe(70000)
      expect(summary.tripCount).toBe(3)
      expect(summary.avgPerTrip).toBe(23333)
      expect(summary.byDay.at(-2)).toEqual({ date: yesterday, amount: 40000, tripCount: 2 })
      expect(summary.byDay.at(-1)).toEqual({ date: today, amount: 30000, tripCount: 1 })
    })

    it('normalizes unsupported periods and returns zero days when ledger is empty', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([])

      const summary = await service.getEarningsSummary('d1', 'unsupported')

      expect(summary.period).toBe('7d')
      expect(summary.byDay).toHaveLength(7)
      expect(summary.totalVnd).toBe(0)
      expect(summary.tripCount).toBe(0)
      expect(summary.avgPerTrip).toBe(0)
    })
  })

  describe('getRatings', () => {
    it('returns driver reviews and derives distribution from real review rows', async () => {
      const createdAt = new Date('2026-07-03T08:00:00Z')
      mockPrisma.review.findMany
        .mockResolvedValueOnce([{ deliveryRating: 5 }, { deliveryRating: 4 }, { deliveryRating: 5 }])
        .mockResolvedValueOnce([
          {
            id: 'review-1',
            deliveryRating: 5,
            comment: 'Fast delivery',
            createdAt,
            order: { id: 'order-1', orderCode: 'FD0000000001' },
            customer: { fullName: 'Customer One', avatarUrl: null },
          },
        ])

      const result = await service.getRatings('d1', '5')

      expect(mockPrisma.review.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({ driverId: 'd1', deliveryRating: 5 }),
        }),
      )
      expect(result.stats).toEqual({
        average: 4.7,
        totalReviews: 3,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 },
      })
      expect(result.reviews).toEqual([
        {
          id: 'review-1',
          customerName: 'Customer One',
          customerAvatarUrl: null,
          rating: 5,
          comment: 'Fast delivery',
          date: createdAt.toISOString(),
          orderId: 'order-1',
          orderCode: 'FD0000000001',
        },
      ])
    })

    it('ignores invalid star filters and returns zero stats for empty reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([])

      const result = await service.getRatings('d1', '9')

      expect(mockPrisma.review.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.not.objectContaining({ deliveryRating: 9 }),
        }),
      )
      expect(result).toEqual({
        reviews: [],
        stats: {
          average: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
        hasMore: false,
      })
    })
  })
})

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
