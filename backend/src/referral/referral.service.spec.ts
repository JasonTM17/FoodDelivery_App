import { Test, TestingModule } from '@nestjs/testing'
import { ReferralService } from './referral.service'
import { PrismaService } from '../database/prisma.service'

const mockPrisma = {
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
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
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ code: 'ABCD1234' }]) // getOrCreateCode
        .mockResolvedValueOnce([{ invitees_count: BigInt(3), rewards_earned: BigInt(150) }]) // fetchStats

      const result = await service.getOrCreateSnapshot('user-uuid')

      expect(result).toEqual({ code: 'ABCD1234', inviteesCount: 3, rewardsEarned: 150 })
    })

    it('auto-generates code when user has none', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([]) // no existing code
        .mockResolvedValueOnce([{ code: 'NEWCODE1' }]) // re-read after insert
        .mockResolvedValueOnce([{ invitees_count: BigInt(0), rewards_earned: BigInt(0) }])

      mockPrisma.$executeRaw.mockResolvedValueOnce(1)

      const result = await service.getOrCreateSnapshot('user-uuid')

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1)
      expect(result.code).toBe('NEWCODE1')
      expect(result.inviteesCount).toBe(0)
      expect(result.rewardsEarned).toBe(0)
    })

    it('returns zeros when fetchStats throws', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ code: 'ABCD1234' }])
        .mockRejectedValueOnce(new Error('db error'))

      const result = await service.getOrCreateSnapshot('user-uuid')

      expect(result.inviteesCount).toBe(0)
      expect(result.rewardsEarned).toBe(0)
    })
  })
})
