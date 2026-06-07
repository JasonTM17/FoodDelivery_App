import { Test, TestingModule } from '@nestjs/testing'
import { ReferralService } from './referral.service'
import { PrismaService } from '../database/prisma.service'

const mockPrisma = {
  referralCode: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  referralRedemption: {
    aggregate: jest.fn(),
  },
}

describe('ReferralService', () => {
  let service: ReferralService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get<ReferralService>(ReferralService)
  })

  describe('getOrCreateSnapshot', () => {
    it('returns existing code with stats', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue({ code: 'ABCD1234' })
      mockPrisma.referralRedemption.aggregate.mockResolvedValue({
        _count: { _all: 3 },
        _sum: { rewardAmount: 150 },
      })

      const result = await service.getOrCreateSnapshot('user-uuid')

      expect(result).toEqual({ code: 'ABCD1234', inviteesCount: 3, rewardsEarned: 150 })
    })

    it('auto-generates code when user has none', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue(null)
      mockPrisma.referralCode.upsert.mockResolvedValue({ code: 'NEWCODE1' })
      mockPrisma.referralRedemption.aggregate.mockResolvedValue({
        _count: { _all: 0 },
        _sum: { rewardAmount: null },
      })

      const result = await service.getOrCreateSnapshot('user-uuid')

      expect(mockPrisma.referralCode.upsert).toHaveBeenCalledTimes(1)
      expect(result.code).toBe('NEWCODE1')
      expect(result.inviteesCount).toBe(0)
      expect(result.rewardsEarned).toBe(0)
    })

    it('returns zeros when fetchStats throws', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue({ code: 'ABCD1234' })
      mockPrisma.referralRedemption.aggregate.mockRejectedValue(new Error('db error'))

      const result = await service.getOrCreateSnapshot('user-uuid')

      expect(result.inviteesCount).toBe(0)
      expect(result.rewardsEarned).toBe(0)
    })
  })
})
