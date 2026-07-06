import { Test, TestingModule } from '@nestjs/testing'
import { ExecutionContext, NotImplementedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IncentivesController } from './incentives.controller'
import { IncentivesService } from './incentives.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'

const mockIncentivesService = {
  getDriverIncentives: jest.fn(),
}

const mockJwtAuthGuard = {
  canActivate: jest.fn((_ctx: ExecutionContext) => true),
}

describe('IncentivesController', () => {
  let controller: IncentivesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncentivesController],
      providers: [
        { provide: IncentivesService, useValue: mockIncentivesService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile()

    controller = module.get(IncentivesController)
    jest.clearAllMocks()
    mockIncentivesService.getDriverIncentives.mockImplementation(() => {
      throw new NotImplementedException('DRIVER_INCENTIVES_NOT_MODELLED')
    })
  })

  it('GET /driver/incentives delegates to service with user sub', () => {
    const user: JwtPayload = { sub: 'driver-uuid-001', role: 'driver' }
    expect(() => controller.getIncentives(user)).toThrow(NotImplementedException)
    expect(mockIncentivesService.getDriverIncentives).toHaveBeenCalledWith('driver-uuid-001')
  })

  it('does not convert unsupported incentives into empty campaign data', () => {
    const user: JwtPayload = { sub: 'driver-uuid-001', role: 'driver' }
    expect(() => controller.getIncentives(user)).toThrow('DRIVER_INCENTIVES_NOT_MODELLED')
  })

  it('JwtAuthGuard is applied to the controller', () => {
    const guards = Reflect.getMetadata('__guards__', IncentivesController)
    expect(guards).toBeDefined()
    expect(guards.length).toBeGreaterThan(0)
  })
})
