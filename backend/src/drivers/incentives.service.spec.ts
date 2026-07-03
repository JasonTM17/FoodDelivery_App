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

    it('does not fabricate active incentives when no campaign source is configured', () => {
      const { active } = service.getDriverIncentives('driver-001')
      expect(active).toHaveLength(0)
    })

    it('completed array is empty when no completed campaign source is configured', () => {
      const { completed } = service.getDriverIncentives('driver-001')
      expect(completed).toHaveLength(0)
    })

    it('returns same shape for any driverId', () => {
      const r1 = service.getDriverIncentives('driver-aaa')
      const r2 = service.getDriverIncentives('driver-bbb')
      expect(r1).toEqual(r2)
    })
  })
})
