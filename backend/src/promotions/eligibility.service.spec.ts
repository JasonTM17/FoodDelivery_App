import { Test, TestingModule } from '@nestjs/testing'
import { I18nService } from 'nestjs-i18n'
import { EligibilityService } from './eligibility.service'
import { PrismaService } from '../database/prisma.service'
import { Promotion, PromotionType } from '@prisma/client'
import { createI18nTestService } from '../../test/i18n-test-utils'

function makePromo(overrides: Partial<Promotion> = {}): Promotion {
  const now = new Date()
  return {
    id: 'promo-id',
    code: 'SAVE10',
    type: 'percentage' as PromotionType,
    value: 10 as unknown as Promotion['value'],
    minOrderAmount: 0 as unknown as Promotion['minOrderAmount'],
    maxDiscount: null,
    usageLimit: 100,
    usageCount: 0,
    currentUsageCount: 0,
    maxPerUser: null,
    firstOrderOnly: false,
    restaurantId: null,
    startsAt: new Date(now.getTime() - 86400000),
    expiresAt: new Date(now.getTime() + 86400000),
    isActive: true,
    createdAt: now,
    ...overrides,
  } as unknown as Promotion
}

const cart = { subtotal: 100_000, restaurantId: 'rest-1' }
const userId = 'user-1'

describe('EligibilityService', () => {
  let service: EligibilityService
  let prisma: jest.Mocked<PrismaService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EligibilityService,
        {
          provide: PrismaService,
          useValue: {
            order: { count: jest.fn().mockResolvedValue(0) },
            promotionUsage: { count: jest.fn().mockResolvedValue(0) },
          },
        },
        { provide: I18nService, useValue: createI18nTestService() },
      ],
    }).compile()

    service = module.get(EligibilityService)
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>
  })

  it('rejects inactive promotion', async () => {
    const res = await service.validate(makePromo({ isActive: false }), cart, userId)
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Mã khuyến mãi không hợp lệ')
  })

  it('rejects expired promotion', async () => {
    const res = await service.validate(
      makePromo({ expiresAt: new Date(Date.now() - 1000) }),
      cart,
      userId,
    )
    expect(res.valid).toBe(false)
    expect(res.error).toContain('hết hạn')
  })

  it('rejects promotion not yet started', async () => {
    const res = await service.validate(
      makePromo({ startsAt: new Date(Date.now() + 86400000) }),
      cart,
      userId,
    )
    expect(res.valid).toBe(false)
    expect(res.error).toContain('hết hạn')
  })

  it('rejects when global cap reached → đã hết lượt', async () => {
    const res = await service.validate(
      makePromo({ usageLimit: 5, currentUsageCount: 5 } as unknown as Partial<Promotion>),
      cart,
      userId,
    )
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Mã đã hết lượt dùng')
  })

  it('rejects when cart subtotal below min order amount', async () => {
    const res = await service.validate(
      makePromo({ minOrderAmount: 200_000 as unknown as Promotion['minOrderAmount'] }),
      cart,
      userId,
    )
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Đơn tối thiểu phải đạt')
    expect(res.error).toContain('200.000')
  })

  it('rejects when restaurant restricted and does not match', async () => {
    const res = await service.validate(
      makePromo({ restaurantId: 'rest-other' }),
      cart,
      userId,
    )
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Mã không áp dụng cho nhà hàng này')
  })

  it('allows when restaurant matches', async () => {
    const res = await service.validate(
      makePromo({ restaurantId: 'rest-1' }),
      cart,
      userId,
    )
    expect(res.valid).toBe(true)
  })

  it('rejects first_order_only when user has prior orders', async () => {
    ;(prisma.order.count as jest.Mock).mockResolvedValueOnce(2)
    const res = await service.validate(
      makePromo({ firstOrderOnly: true }),
      cart,
      userId,
    )
    expect(res.valid).toBe(false)
    expect(res.error).toBe('Mã chỉ áp dụng cho đơn đầu tiên')
  })

  it('allows first_order_only when user has no orders', async () => {
    ;(prisma.order.count as jest.Mock).mockResolvedValueOnce(0)
    const res = await service.validate(makePromo({ firstOrderOnly: true }), cart, userId)
    expect(res.valid).toBe(true)
  })

  it('rejects when max_per_user exceeded', async () => {
    ;(prisma.promotionUsage.count as jest.Mock).mockResolvedValueOnce(3)
    const res = await service.validate(
      makePromo({ maxPerUser: 3 }),
      cart,
      userId,
    )
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Bạn đã dùng mã này tối đa 3 lần')
  })

  describe('calculateDiscount', () => {
    it('percentage with maxDiscount cap', () => {
      const promo = makePromo({
        type: 'percentage' as PromotionType,
        value: 50 as unknown as Promotion['value'],
        maxDiscount: 30_000 as unknown as Promotion['maxDiscount'],
      })
      expect(service.calculateDiscount(promo, 100_000)).toBe(30_000)
    })

    it('percentage without cap', () => {
      const promo = makePromo({ type: 'percentage' as PromotionType, value: 10 as unknown as Promotion['value'] })
      expect(service.calculateDiscount(promo, 100_000)).toBe(10_000)
    })

    it('fixed capped at subtotal', () => {
      const promo = makePromo({ type: 'fixed' as PromotionType, value: 200_000 as unknown as Promotion['value'] })
      expect(service.calculateDiscount(promo, 100_000)).toBe(100_000)
    })

    it('free_delivery returns value', () => {
      const promo = makePromo({ type: 'free_delivery' as PromotionType, value: 20_000 as unknown as Promotion['value'] })
      expect(service.calculateDiscount(promo, 100_000)).toBe(20_000)
    })
  })
})
