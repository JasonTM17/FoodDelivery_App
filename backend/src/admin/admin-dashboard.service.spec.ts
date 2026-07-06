import { PrismaService } from '../database/prisma.service'
import { AdminDashboardService } from './admin-dashboard.service'

describe('AdminDashboardService', () => {
  const prisma = {
    order: { findMany: jest.fn() },
    user: { count: jest.fn(), findMany: jest.fn() },
    restaurant: { count: jest.fn(), findMany: jest.fn() },
    driverProfile: { count: jest.fn() },
    $queryRaw: jest.fn(),
  }
  const service = new AdminDashboardService(prisma as unknown as PrismaService)

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-08T12:34:00.000Z'))
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('builds database-backed KPI deltas and sparklines for inventory and driver metrics', async () => {
    prisma.order.findMany
      .mockResolvedValueOnce([
        { createdAt: new Date('2026-07-02T01:00:00.000Z'), status: 'delivered', total: 100_000 },
        { createdAt: new Date('2026-07-03T01:00:00.000Z'), status: 'created', total: 50_000 },
        { createdAt: new Date('2026-07-06T01:00:00.000Z'), status: 'completed', total: 200_000 },
      ])
      .mockResolvedValueOnce([{ status: 'completed', total: 100_000 }])
    prisma.user.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(10)
    prisma.restaurant.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(4)
    prisma.driverProfile.count.mockResolvedValueOnce(3)
    prisma.user.findMany.mockResolvedValueOnce([
      { createdAt: new Date('2026-07-03T09:00:00.000Z') },
      { createdAt: new Date('2026-07-08T09:00:00.000Z') },
    ])
    prisma.restaurant.findMany.mockResolvedValueOnce([
      { createdAt: new Date('2026-07-01T09:00:00.000Z'), approvedAt: new Date('2026-07-05T09:00:00.000Z') },
    ])
    prisma.$queryRaw
      .mockResolvedValueOnce([
        { date: '2026-07-04', count: 2n },
        { date: '2026-07-06', count: 4 },
      ])
      .mockResolvedValueOnce([{ date: '2026-06-27', count: 1 }])

    const result = await service.getKpis('7d')
    const byKey = new Map(result.kpis.map(kpi => [kpi.key, kpi]))

    expect(byKey.get('revenue')?.sparkline).toEqual([100_000, 0, 0, 0, 200_000, 0, 0])
    expect(byKey.get('orders')?.sparkline).toEqual([1, 1, 0, 0, 1, 0, 0])
    expect(byKey.get('users')?.delta).toBeCloseTo(0.2)
    expect(byKey.get('users')?.sparkline).toEqual([10, 11, 11, 11, 11, 11, 12])
    expect(byKey.get('restaurants')?.delta).toBeCloseTo(0.25)
    expect(byKey.get('restaurants')?.sparkline).toEqual([4, 4, 4, 5, 5, 5, 5])
    expect(byKey.get('drivers')?.sparkline).toEqual([0, 0, 2, 0, 4, 0, 0])
    expect(byKey.get('drivers')?.delta).toBeGreaterThan(0)
  })

  it('uses hourly KPI sparklines for today so dashboard cards are not blank', async () => {
    prisma.order.findMany
      .mockResolvedValueOnce([
        { createdAt: new Date('2026-07-08T12:10:00.000Z'), status: 'delivered', total: 100_000 },
      ])
      .mockResolvedValueOnce([])
    prisma.user.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
    prisma.restaurant.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
    prisma.driverProfile.count.mockResolvedValueOnce(1)
    prisma.user.findMany.mockResolvedValueOnce([])
    prisma.restaurant.findMany.mockResolvedValueOnce([])
    prisma.$queryRaw
      .mockResolvedValueOnce([{ bucketStart: new Date('2026-07-08T12:00:00.000Z'), count: 1 }])
      .mockResolvedValueOnce([])

    const result = await service.getKpis('today')

    for (const kpi of result.kpis) {
      expect(kpi.sparkline).toHaveLength(24)
      expect(Number.isFinite(kpi.delta)).toBe(true)
    }
    expect(result.kpis.find(kpi => kpi.key === 'revenue')?.sparkline.at(-1)).toBe(100_000)
    expect(result.kpis.find(kpi => kpi.key === 'drivers')?.sparkline.at(-1)).toBe(1)
  })

  it('builds real retention cohorts and fills empty days', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { date: '2026-07-01', new_customers: 2n, retained_customers: 1n },
      { date: '2026-07-03', new_customers: 3, retained_customers: 2 },
    ])

    const result = await service.getRetentionCohorts(
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-07-04T00:00:00.000Z'),
      3,
    )

    expect(result).toEqual([
      { date: '2026-07-01', newCustomers: 2, retainedCustomers: 1, retentionRate: 50 },
      { date: '2026-07-02', newCustomers: 0, retainedCustomers: 0, retentionRate: 0 },
      { date: '2026-07-03', newCustomers: 3, retainedCustomers: 2, retentionRate: 66.7 },
    ])
  })
})
