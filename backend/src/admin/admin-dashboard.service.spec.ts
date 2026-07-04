import { PrismaService } from '../database/prisma.service'
import { AdminDashboardService } from './admin-dashboard.service'

describe('AdminDashboardService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  }
  const service = new AdminDashboardService(prisma as unknown as PrismaService)

  beforeEach(() => {
    jest.clearAllMocks()
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
