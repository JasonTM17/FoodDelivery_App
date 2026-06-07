import { Test, TestingModule } from '@nestjs/testing'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IncentivesController } from './incentives.controller'
import { IncentivesService } from './incentives.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'

const mockIncentivesService = {
  getDriverIncentives: jest.fn().mockReturnValue({
    active: [
      {
        id: 'incentive-001',
        title: 'Weekend Rush Bonus',
        rewardAmount: 100000,
        progress: 3,
        target: 10,
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    completed: [],
  }),
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
    mockIncentivesService.getDriverIncentives.mockReturnValue({
      active: [
        {
          id: 'incentive-001',
          title: 'Weekend Rush Bonus',
          rewardAmount: 100000,
          progress: 3,
          target: 10,
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      completed: [],
    })
  })

  it('GET /driver/incentives delegates to service with user sub', () => {
    const user: JwtPayload = { sub: 'driver-uuid-001', role: 'driver' }
    controller.getIncentives(user)
    expect(mockIncentivesService.getDriverIncentives).toHaveBeenCalledWith('driver-uuid-001')
  })

  it('returns active incentives array', () => {
    const user: JwtPayload = { sub: 'driver-uuid-001', role: 'driver' }
    const result = controller.getIncentives(user)
    expect(result.active).toHaveLength(1)
    expect(result.active[0].id).toBe('incentive-001')
  })

  it('returns empty completed array', () => {
    const user: JwtPayload = { sub: 'driver-uuid-001', role: 'driver' }
    const result = controller.getIncentives(user)
    expect(result.completed).toHaveLength(0)
  })

  it('JwtAuthGuard is applied to the controller', () => {
    const guards = Reflect.getMetadata('__guards__', IncentivesController)
    expect(guards).toBeDefined()
    expect(guards.length).toBeGreaterThan(0)
  })
})
