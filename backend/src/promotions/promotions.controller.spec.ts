import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { PromotionsController } from './promotions.controller'
import { PromotionsService } from './promotions.service'

const PROMO_STUB = { id: 'p1', code: 'SAVE10', type: 'percentage', value: 10 }

describe('PromotionsController', () => {
  let controller: PromotionsController
  let service: jest.Mocked<Pick<PromotionsService, 'findByCode' | 'listAvailable' | 'listMine' | 'preview'>>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [
        {
          provide: PromotionsService,
          useValue: {
            findByCode: jest.fn().mockResolvedValue(PROMO_STUB),
            listAvailable: jest.fn().mockResolvedValue([PROMO_STUB]),
            listMine: jest.fn().mockResolvedValue([]),
            preview: jest.fn().mockResolvedValue({ discountAmount: 10000 }),
          },
        },
      ],
    })
      .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get(PromotionsController)
    service = module.get(PromotionsService) as jest.Mocked<
      Pick<PromotionsService, 'findByCode' | 'listAvailable' | 'listMine' | 'preview'>
    >
  })

  it('delegates getByCode to service', async () => {
    const result = await controller.getByCode('SAVE10')
    expect(service.findByCode).toHaveBeenCalledWith('SAVE10')
    expect(result).toEqual(PROMO_STUB)
  })

  it('scopes available promotions to the authenticated customer', async () => {
    const result = await controller.listAvailable({ sub: 'user-1' } as never)
    expect(service.listAvailable).toHaveBeenCalledWith('user-1')
    expect(result).toEqual([PROMO_STUB])
  })

  it('validates a promotion against the authenticated customer cart context', async () => {
    const result = await controller.validate({ sub: 'user-1' } as never, {
      code: ' SAVE10 ',
      restaurantId: 'restaurant-1',
      subtotal: 120000,
    })

    expect(service.preview).toHaveBeenCalledWith(
      'SAVE10',
      { restaurantId: 'restaurant-1', subtotal: 120000 },
      'user-1',
    )
    expect(result).toEqual({ discountAmount: 10000 })
  })

  it('rejects malformed promotion validation bodies', () => {
    expect(() => controller.validate({ sub: 'user-1' } as never, {
      code: '',
      restaurantId: 'restaurant-1',
      subtotal: 120000,
    })).toThrow(BadRequestException)
  })

  it('scopes promotion history to the authenticated customer', async () => {
    const result = await controller.listMine({ sub: 'user-1' } as never)
    expect(service.listMine).toHaveBeenCalledWith('user-1')
    expect(result).toEqual([])
  })
})
