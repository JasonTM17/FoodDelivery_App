import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../database/prisma.service'
import { LoyaltyService } from './loyalty.service'

const mockPrisma = {
  loyaltyTransaction: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
}

describe('LoyaltyService', () => {
  let service: LoyaltyService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get<LoyaltyService>(LoyaltyService)
  })

  const userId = 'a1b2c3d4-0000-0000-0000-000000000000'

  it('returns real point totals and recent transactions', async () => {
    mockPrisma.loyaltyTransaction.aggregate
      .mockResolvedValueOnce({ _sum: { points: 2_500 } })
      .mockResolvedValueOnce({ _sum: { points: 400 } })
    mockPrisma.loyaltyTransaction.findMany.mockResolvedValue([
      {
        id: 'loyalty-1',
        userId,
        points: 500,
        type: 'credit',
        description: 'Order reward',
        createdAt: new Date('2026-06-01T00:00:00Z'),
      },
    ])

    const snapshot = await service.getSnapshot(userId)

    expect(snapshot).toEqual({
      totalPoints: 2_100,
      tier: 'gold',
      pointsToNextTier: 2_900,
      transactions: [
        {
          id: 'loyalty-1',
          points: 500,
          type: 'credit',
          description: 'Order reward',
          createdAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    })
  })

  it('returns zero points only when the loyalty ledger is empty', async () => {
    mockPrisma.loyaltyTransaction.aggregate
      .mockResolvedValueOnce({ _sum: { points: null } })
      .mockResolvedValueOnce({ _sum: { points: null } })
    mockPrisma.loyaltyTransaction.findMany.mockResolvedValue([])

    const snapshot = await service.getSnapshot(userId)

    expect(snapshot.totalPoints).toBe(0)
    expect(snapshot.tier).toBe('bronze')
    expect(snapshot.pointsToNextTier).toBe(500)
    expect(snapshot.transactions).toEqual([])
  })

  it('propagates db errors instead of returning fake zero loyalty data', async () => {
    mockPrisma.loyaltyTransaction.aggregate.mockRejectedValue(new Error('db down'))
    mockPrisma.loyaltyTransaction.findMany.mockRejectedValue(new Error('db down'))

    await expect(service.getSnapshot(userId)).rejects.toThrow('db down')
  })
})
