import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { AdminService } from './admin.service'
import { PrismaService } from '../database/prisma.service'

const heatmapRows = [
  { districtCode: 'district-1', lat: 10.78, lng: 106.69, orderCount: 12 },
  { districtCode: 'district-2', lat: 10.8, lng: 106.7, orderCount: 8 },
]

const ratingRows = [
  { date: '2026-06-01', rating: 4.6 },
  { date: '2026-06-02', rating: 4.7 },
]

const revenueRows = [
  { date: '2026-06-01', revenue: 1_200_000 },
  { date: '2026-06-02', revenue: 1_500_000 },
]

const mockPrisma = {
  order: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  payment: { aggregate: jest.fn() },
  driverProfile: { count: jest.fn() },
  user: { count: jest.fn(), findMany: jest.fn() },
  restaurant: { count: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  aiSupportTicket: { count: jest.fn(), findMany: jest.fn() },
  adminAuditLog: { count: jest.fn(), findMany: jest.fn() },
  promotion: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  $queryRaw: jest.fn(),
}

describe('AdminService — analytics resources', () => {
  let service: AdminService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get(AdminService)
  })

  describe('getDispatchHeatmap', () => {
    it('returns district heatmap rows from the aggregate query', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce(heatmapRows)

      const result = await service.getDispatchHeatmap('2026-06-01T00:00:00.000Z')

      expect(result).toEqual(heatmapRows)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1)
    })

    it('rejects an invalid since query instead of falling back to a synthetic window', () => {
      expect(() => service.getDispatchHeatmap('not-a-date')).toThrow(BadRequestException)
      expect(() => service.getDispatchHeatmap('not-a-date')).toThrow('ADMIN_DISPATCH_HEATMAP_SINCE_INVALID')
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled()
    })

    it('rejects a missing since query instead of silently using the last 24 hours', () => {
      expect(() => service.getDispatchHeatmap('')).toThrow(BadRequestException)
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled()
    })

    it('rejects repeated since query values instead of throwing a TypeError', () => {
      expect(() => service.getDispatchHeatmap(['2026-06-01T00:00:00.000Z'])).toThrow(BadRequestException)
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled()
    })
  })

  describe('getRestaurantKpi', () => {
    beforeEach(() => {
      mockPrisma.order.aggregate.mockResolvedValue({
        _avg: { estimatedPrepTimeMinutes: 18.4 },
        _count: { _all: 4 },
      })
      mockPrisma.order.count.mockResolvedValue(3)
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(ratingRows)
        .mockResolvedValueOnce(revenueRows)
    })

    it('returns KPI aggregates with rating and revenue trends', async () => {
      const result = await service.getRestaurantKpi('rest-001', '7d')

      expect(result).toEqual({
        avgPrepTimeMin: 18,
        fulfillmentRate: 0.75,
        ratingTrend: ratingRows,
        revenueByDay: revenueRows,
      })
    })

    it('returns null fulfillment rate when there are no orders', async () => {
      mockPrisma.order.aggregate.mockResolvedValueOnce({
        _avg: { estimatedPrepTimeMinutes: null },
        _count: { _all: 0 },
      })

      const result = await service.getRestaurantKpi('rest-001', '30d')

      expect(result.fulfillmentRate).toBeNull()
      expect(result.avgPrepTimeMin).toBe(0)
    })
  })
})
