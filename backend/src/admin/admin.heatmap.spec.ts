import { Test, TestingModule } from '@nestjs/testing'
import { AdminService } from './admin.service'
import { PrismaService } from '../database/prisma.service'

const mockPrisma = {
  order: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
  payment: { aggregate: jest.fn() },
  driverProfile: { count: jest.fn() },
  user: { count: jest.fn(), findMany: jest.fn() },
  restaurant: { count: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  aiSupportTicket: { count: jest.fn(), findMany: jest.fn() },
  adminAuditLog: { count: jest.fn(), findMany: jest.fn() },
  promotion: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  $queryRawUnsafe: jest.fn(),
}

describe('AdminService — Dispatch Heatmap', () => {
  let service: AdminService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get(AdminService)
  })

  describe('getDispatchHeatmap', () => {
    it('returns exactly 7 district entries', () => {
      const result = service.getDispatchHeatmap('2026-06-01')
      expect(result).toHaveLength(7)
    })

    it('each entry has districtCode, lat, lng, orderCount', () => {
      const result = service.getDispatchHeatmap('2026-06-01')
      for (const entry of result) {
        expect(entry).toMatchObject({
          districtCode: expect.any(String),
          lat: expect.any(Number),
          lng: expect.any(Number),
          orderCount: expect.any(Number),
        })
      }
    })

    it('district codes are unique', () => {
      const result = service.getDispatchHeatmap('2026-06-01')
      const codes = result.map(e => e.districtCode)
      expect(new Set(codes).size).toBe(7)
    })

    it('all orderCounts are positive integers', () => {
      const result = service.getDispatchHeatmap('2026-06-01')
      for (const entry of result) {
        expect(entry.orderCount).toBeGreaterThan(0)
        expect(Number.isInteger(entry.orderCount)).toBe(true)
      }
    })
  })

  describe('getRestaurantKpi', () => {
    it('default period returns 7-day ratingTrend and revenueByDay', () => {
      const result = service.getRestaurantKpi('rest-001', '7d')
      expect(result.ratingTrend).toHaveLength(7)
      expect(result.revenueByDay).toHaveLength(7)
    })

    it('14d period returns 14-day arrays', () => {
      const result = service.getRestaurantKpi('rest-001', '14d')
      expect(result.ratingTrend).toHaveLength(14)
      expect(result.revenueByDay).toHaveLength(14)
    })

    it('30d period returns 30-day arrays', () => {
      const result = service.getRestaurantKpi('rest-001', '30d')
      expect(result.ratingTrend).toHaveLength(30)
      expect(result.revenueByDay).toHaveLength(30)
    })

    it('has required top-level fields', () => {
      const result = service.getRestaurantKpi('rest-001', '7d')
      expect(result).toMatchObject({
        avgPrepTimeMin: expect.any(Number),
        fulfillmentRate: expect.any(Number),
      })
    })

    it('each ratingTrend entry has date and rating', () => {
      const { ratingTrend } = service.getRestaurantKpi('rest-001', '7d')
      for (const entry of ratingTrend) {
        expect(entry).toMatchObject({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          rating: expect.any(Number),
        })
        expect(entry.rating).toBeGreaterThanOrEqual(4.0)
        expect(entry.rating).toBeLessThanOrEqual(5.0)
      }
    })

    it('each revenueByDay entry has date and revenue', () => {
      const { revenueByDay } = service.getRestaurantKpi('rest-001', '7d')
      for (const entry of revenueByDay) {
        expect(entry).toMatchObject({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          revenue: expect.any(Number),
        })
        expect(entry.revenue).toBeGreaterThan(0)
      }
    })
  })
})
