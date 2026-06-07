import { StackingService, PromotionWithDiscount } from './stacking.service'
import { Promotion, PromotionType } from '@prisma/client'

function makePromo(
  code: string,
  type: PromotionType,
  discountAmount: number,
): PromotionWithDiscount {
  return {
    id: code,
    code,
    type,
    value: discountAmount as unknown as Promotion['value'],
    discountAmount,
    minOrderAmount: 0 as unknown as Promotion['minOrderAmount'],
    maxDiscount: null,
    usageLimit: 100,
    usageCount: 0,
    currentUsageCount: 0,
    maxPerUser: null,
    firstOrderOnly: false,
    restaurantId: null,
    startsAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    isActive: true,
    createdAt: new Date(),
  } as unknown as PromotionWithDiscount
}

describe('StackingService', () => {
  let service: StackingService

  beforeEach(() => {
    service = new StackingService()
  })

  it('returns empty result for empty input', () => {
    const res = service.combine([])
    expect(res.accepted).toHaveLength(0)
    expect(res.rejected).toHaveLength(0)
    expect(res.totalDiscount).toBe(0)
  })

  it('accepts a single percentage promo without rejection', () => {
    const res = service.combine([makePromo('SAVE10', 'percentage', 10_000)])
    expect(res.accepted).toHaveLength(1)
    expect(res.rejected).toHaveLength(0)
    expect(res.totalDiscount).toBe(10_000)
  })

  it('accepts a single fixed promo without rejection', () => {
    const res = service.combine([makePromo('FLAT20', 'fixed', 20_000)])
    expect(res.accepted[0].code).toBe('FLAT20')
    expect(res.rejected).toHaveLength(0)
  })

  it('accepts a single free_delivery promo without rejection', () => {
    const res = service.combine([makePromo('FREEDEL', 'free_delivery', 15_000)])
    expect(res.accepted[0].code).toBe('FREEDEL')
    expect(res.rejected).toHaveLength(0)
  })

  it('accepts percentage + free_delivery together (valid combo)', () => {
    const res = service.combine([
      makePromo('SAVE10', 'percentage', 10_000),
      makePromo('FREEDEL', 'free_delivery', 15_000),
    ])
    expect(res.accepted).toHaveLength(2)
    expect(res.rejected).toHaveLength(0)
    expect(res.totalDiscount).toBe(25_000)
  })

  it('rejects the lower-discount percentage when two are submitted', () => {
    const res = service.combine([
      makePromo('SAVE5', 'percentage', 5_000),
      makePromo('SAVE15', 'percentage', 15_000),
    ])
    expect(res.accepted).toHaveLength(1)
    expect(res.accepted[0].code).toBe('SAVE15')
    expect(res.rejected[0].code).toBe('SAVE5')
    expect(res.reason).toContain('1 mã')
  })

  it('rejects the lower-discount free_delivery when two are submitted', () => {
    const res = service.combine([
      makePromo('FREE1', 'free_delivery', 20_000),
      makePromo('FREE2', 'free_delivery', 10_000),
    ])
    expect(res.accepted[0].code).toBe('FREE1')
    expect(res.rejected[0].code).toBe('FREE2')
  })

  it('rejects fixed when mixed with percentage — fixed cannot stack', () => {
    const res = service.combine([
      makePromo('FLAT20', 'fixed', 20_000),
      makePromo('SAVE10', 'percentage', 10_000),
    ])
    expect(res.accepted).toHaveLength(1)
    expect(res.accepted[0].code).toBe('SAVE10')
    expect(res.rejected[0].code).toBe('FLAT20')
    expect(res.reason).toContain('cố định')
  })

  it('rejects fixed when mixed with free_delivery', () => {
    const res = service.combine([
      makePromo('FLAT20', 'fixed', 20_000),
      makePromo('FREEDEL', 'free_delivery', 15_000),
    ])
    expect(res.accepted[0].code).toBe('FREEDEL')
    expect(res.rejected[0].code).toBe('FLAT20')
  })

  it('accepts best fixed and rejects lower fixed when all are fixed type', () => {
    const res = service.combine([
      makePromo('FLAT10', 'fixed', 10_000),
      makePromo('FLAT30', 'fixed', 30_000),
    ])
    expect(res.accepted[0].code).toBe('FLAT30')
    expect(res.rejected[0].code).toBe('FLAT10')
  })

  it('computes totalDiscount correctly for accepted promos', () => {
    const res = service.combine([
      makePromo('SAVE10', 'percentage', 10_000),
      makePromo('FREEDEL', 'free_delivery', 15_000),
      makePromo('SAVE5', 'percentage', 5_000),
    ])
    // Best percent + free_delivery accepted
    expect(res.totalDiscount).toBe(25_000)
  })
})
