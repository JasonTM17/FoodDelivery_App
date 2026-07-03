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
    order: { findFirst: jest.fn(), findMany: jest.fn() },
    payoutLedger: { findMany: jest.fn() },
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
      mockPrisma.driverProfile.findUniqueOrThrow.mockResolvedValueOnce({
        isVerified: false,
        rating: '4.0',
        totalDeliveries: 0,
      })
      await expect(service.goOnline('d1', 10.8, 106.7)).rejects.toThrow(BadRequestException)
    })

    it('adds driver to Redis GEO and sets status', async () => {
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
      expect(mockRedis.geoadd).toHaveBeenCalled()
      expect(mockRedis.set).toHaveBeenCalledWith('driver:d1:status', 'online')
      expect(mockRedis.set).toHaveBeenCalledWith('driver:d1:rating', '4.5')
      expect(mockRedis.set).toHaveBeenCalledWith('driver:d1:total_deliveries', '37')
      expect(mockRedis.set).toHaveBeenCalledWith(
        'driver:d1:idle_since',
        expect.stringMatching(/^\d+$/),
      )
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'driver:d1:last_seen_at',
        35,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      )
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
            completedAt: '2026-07-03T08:00:00.000Z',
          },
        ],
      })
    })

    it('rejects unsupported periods instead of coercing them to month', async () => {
      await expect(service.getEarnings('driver-1', 'year')).rejects.toThrow(
        new BadRequestException('INVALID_EARNINGS_PERIOD'),
      )
      expect(mockPrisma.payoutLedger.findMany).not.toHaveBeenCalled()
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

  describe('driver orders', () => {
    const order = {
      id: 'order-1',
      customerId: 'customer-1',
      restaurantId: 'restaurant-1',
      driverId: 'driver-1',
      subtotal: 100000,
      deliveryFee: 15000,
      promotionDiscount: 5000,
      total: 110000,
      status: 'delivering',
      paymentMethod: 'cash',
      notes: 'Use the side gate',
      createdAt: new Date('2026-07-03T08:00:00Z'),
      updatedAt: new Date('2026-07-03T08:30:00Z'),
      estimatedDeliveryTimeMinutes: 14,
      routePolyline: 'encoded-route',
      restaurant: {
        name: 'FoodFlow Kitchen',
        logoUrl: null,
        addressLine: '1 Kitchen Street',
        phone: '0900000001',
      },
      customer: { fullName: 'Customer One', phone: '0900000002' },
      deliveryAddress: { label: 'Home', addressLine: '2 Customer Street' },
      orderItems: [{
        menuItemId: 'item-1',
        nameSnapshot: 'Noodle Bowl',
        quantity: 2,
        unitPrice: 50000,
        selectedOptions: [],
      }],
      statusHistory: [{
        status: 'delivering',
        createdAt: new Date('2026-07-03T08:20:00Z'),
        note: null,
      }],
    }

    it('returns only the authenticated driver active order with real coordinates', async () => {
      mockPrisma.order.findFirst.mockResolvedValueOnce(order)
      mockPrisma.$queryRaw.mockResolvedValueOnce([{
        restaurantLat: 10.77,
        restaurantLng: 106.69,
        deliveryLat: 10.79,
        deliveryLng: 106.71,
      }])

      const result = await service.getActiveOrder('driver-1')

      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ driverId: 'driver-1' }),
      }))
      expect(result).toMatchObject({
        id: 'order-1',
        customerPhone: '0900000002',
        restaurantPhone: '0900000001',
        estimatedDeliveryTimeMinutes: 14,
        deliveryAddress: {
          address: '2 Customer Street',
          latitude: 10.79,
          longitude: 106.71,
        },
      })
    })

    it('returns null instead of generated order data when no active order exists', async () => {
      mockPrisma.order.findFirst.mockResolvedValueOnce(null)

      await expect(service.getActiveOrder('driver-1')).resolves.toBeNull()
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled()
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

  describe('getTripRoute', () => {
    it('returns telemetry route points and payout ledger amount for the authenticated driver', async () => {
      const assignedAt = new Date('2026-07-03T08:00:00Z')
      const deliveredAt = new Date('2026-07-03T08:10:00Z')
      mockPrisma.order.findFirst.mockResolvedValueOnce({
        id: 'order-1',
        orderCode: 'FD0000000001',
        createdAt: assignedAt,
        updatedAt: deliveredAt,
        routePolyline: null,
        routeWaypoints: null,
        deliveryTask: {
          assignedAt,
          deliveredAt,
          pickupDistanceKm: 1.2,
          deliveryDistanceKm: 2.3,
          durationInTraffic: 600,
        },
        payoutLedgers: [{ amount: 25000 }],
      })
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { lat: 10.7769, lng: 106.7009, timestamp: assignedAt },
        { lat: 10.7869, lng: 106.7109, timestamp: deliveredAt },
      ])

      const route = await service.getTripRoute('driver-1', 'FD0000000001')

      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ driverId: 'driver-1' }),
      }))
      expect(route).toEqual({
        tripId: 'order-1',
        points: [
          { lat: 10.7769, lng: 106.7009, timestamp: assignedAt.toISOString() },
          { lat: 10.7869, lng: 106.7109, timestamp: deliveredAt.toISOString() },
        ],
        segments: [],
        totalDistanceKm: 3.5,
        totalDurationSeconds: 600,
        avgSpeedKmh: 21,
        payout: 25000,
      })
    })

    it('returns an empty route instead of generated sample data when no telemetry or persisted route exists', async () => {
      const createdAt = new Date('2026-07-03T08:00:00Z')
      mockPrisma.order.findFirst.mockResolvedValueOnce({
        id: 'order-2',
        orderCode: 'FD0000000002',
        createdAt,
        updatedAt: createdAt,
        routePolyline: null,
        routeWaypoints: null,
        deliveryTask: null,
        payoutLedgers: [],
      })
      mockPrisma.$queryRaw.mockResolvedValueOnce([])

      const route = await service.getTripRoute('driver-1', 'order-2')

      expect(route).toEqual({
        tripId: 'order-2',
        points: [],
        segments: [],
        totalDistanceKm: 0,
        totalDurationSeconds: 0,
        avgSpeedKmh: 0,
        payout: 0,
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
