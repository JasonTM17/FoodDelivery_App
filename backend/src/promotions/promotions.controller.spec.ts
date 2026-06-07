import { Test, TestingModule } from '@nestjs/testing'
import { PromotionsController } from './promotions.controller'
import { PromotionsService } from './promotions.service'

const PROMO_STUB = { id: 'p1', code: 'SAVE10', type: 'percentage', value: 10 }

describe('PromotionsController', () => {
  let controller: PromotionsController
  let service: jest.Mocked<Pick<PromotionsService, 'findByCode'>>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [
        {
          provide: PromotionsService,
          useValue: { findByCode: jest.fn().mockResolvedValue(PROMO_STUB) },
        },
      ],
    })
      .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get(PromotionsController)
    service = module.get(PromotionsService) as jest.Mocked<Pick<PromotionsService, 'findByCode'>>
  })

  it('delegates getByCode to service', async () => {
    const result = await controller.getByCode('SAVE10')
    expect(service.findByCode).toHaveBeenCalledWith('SAVE10')
    expect(result).toEqual(PROMO_STUB)
  })
})
