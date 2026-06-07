import { Test, TestingModule } from '@nestjs/testing'
import { IncentivesService, IncentivesResponse } from './incentives.service'

describe('IncentivesService', () => {
  let service: IncentivesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncentivesService],
    }).compile()
    service = module.get(IncentivesService)
  })

  describe('getDriverIncentives', () => {
    it('returns IncentivesResponse with active and completed arrays', () => {
      const result: IncentivesResponse = service.getDriverIncentives('driver-001')
      expect(result).toHaveProperty('active')
      expect(result).toHaveProperty('completed')
      expect(Array.isArray(result.active)).toBe(true)
      expect(Array.isArray(result.completed)).toBe(true)
    })

    it('active array contains one stub incentive', () => {
      const { active } = service.getDriverIncentives('driver-001')
      expect(active).toHaveLength(1)
    })

    it('active item has required shape', () => {
      const { active } = service.getDriverIncentives('driver-001')
      const item = active[0]
      expect(item).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        rewardAmount: expect.any(Number),
        progress: expect.any(Number),
        target: expect.any(Number),
        endsAt: expect.any(String),
      })
    })

    it('active item endsAt is a future ISO date', () => {
      const { active } = service.getDriverIncentives('driver-001')
      const endsAt = new Date(active[0].endsAt)
      expect(endsAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('completed array is empty in stub', () => {
      const { completed } = service.getDriverIncentives('driver-001')
      expect(completed).toHaveLength(0)
    })

    it('returns same shape for any driverId', () => {
      const r1 = service.getDriverIncentives('driver-aaa')
      const r2 = service.getDriverIncentives('driver-bbb')
      expect(r1.active[0].id).toBe(r2.active[0].id)
    })
  })
})
