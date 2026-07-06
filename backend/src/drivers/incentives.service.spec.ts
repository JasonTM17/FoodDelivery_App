import { Test, TestingModule } from '@nestjs/testing'
import { NotImplementedException } from '@nestjs/common'
import { IncentivesService } from './incentives.service'

describe('IncentivesService', () => {
  let service: IncentivesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncentivesService],
    }).compile()
    service = module.get(IncentivesService)
  })

  describe('getDriverIncentives', () => {
    it('fails explicitly while no durable campaign source is modelled', () => {
      expect(() => service.getDriverIncentives('driver-001')).toThrow(NotImplementedException)
      expect(() => service.getDriverIncentives('driver-001')).toThrow('DRIVER_INCENTIVES_NOT_MODELLED')
    })
  })
})
