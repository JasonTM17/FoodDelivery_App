import { BadRequestException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'
import {
  buildTargetingPreview,
  RestaurantPromotionTargetingService,
} from './restaurant-promotion-targeting.service'

const NOW = new Date('2026-07-02T00:00:00.000Z')

describe('RestaurantPromotionTargetingService', () => {
  const getRestaurantId = jest.fn().mockResolvedValue('restaurant-1')
  const groupBy = jest.fn()
  const service = new RestaurantPromotionTargetingService(
    { order: { groupBy } } as unknown as PrismaService,
    { getRestaurantId } as unknown as RestaurantAccessService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    getRestaurantId.mockResolvedValue('restaurant-1')
    groupBy.mockResolvedValue(makeCustomers())
  })

  it('isolates the audience query to the authenticated restaurant', async () => {
    const result = await service.preview('owner-1', { audience: 'all' })

    expect(result.estimatedReach).toBe(3)
    expect(groupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ restaurantId: 'restaurant-1' }),
    }))
  })

  it('rejects saved segments until a real segment source exists', async () => {
    await expect(service.preview('owner-1', {
      audience: 'segment',
      segmentId: 'segment-1',
    })).rejects.toBeInstanceOf(BadRequestException)
    expect(groupBy).not.toHaveBeenCalled()
  })

  it('resolves VIP customer ids by successful-order count', async () => {
    groupBy.mockResolvedValue([
      makeCustomer('regular', 2, '2026-01-01T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
      makeCustomer('vip', 20, '2026-01-01T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
    ])

    await expect(service.resolveCustomerIds('owner-1', { audience: 'vip' }))
      .resolves.toEqual(['vip'])
  })
})

describe('buildTargetingPreview', () => {
  it('counts new, returning, and lapsed customers from real order history', () => {
    const preview = buildTargetingPreview(makeCustomers(), { audience: 'all' }, NOW)

    expect(preview.estimatedReach).toBe(3)
    expect(preview.breakdown).toEqual([
      { key: 'new', count: 1, pct: 33 },
      { key: 'returning', count: 1, pct: 33 },
      { key: 'lapsed', count: 1, pct: 33 },
    ])
  })

  it('uses the top ten percent of actual customers for VIP reach', () => {
    const customers = Array.from({ length: 21 }, (_, index) => makeCustomer(
      `customer-${index}`,
      30 - index,
      '2026-05-01T00:00:00.000Z',
      '2026-07-01T00:00:00.000Z',
    ))

    expect(buildTargetingPreview(customers, { audience: 'vip' }, NOW).estimatedReach).toBe(3)
  })

  it('honors the minimum successful-order count', () => {
    const preview = buildTargetingPreview(
      makeCustomers(),
      { audience: 'order_history', minOrderCount: 5 },
      NOW,
    )

    expect(preview.estimatedReach).toBe(1)
  })

  it('returns zero instead of fabricated reach when no customers qualify', () => {
    const preview = buildTargetingPreview([], { audience: 'new' }, NOW)

    expect(preview.estimatedReach).toBe(0)
    expect(preview.breakdown.every(row => row.pct === 0)).toBe(true)
  })
})

function makeCustomers() {
  return [
    makeCustomer('new', 1, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
    makeCustomer('returning', 5, '2026-01-01T00:00:00.000Z', '2026-06-25T00:00:00.000Z'),
    makeCustomer('lapsed', 2, '2026-01-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z'),
  ]
}

function makeCustomer(
  customerId: string,
  orderCount: number,
  firstOrderAt: string,
  lastOrderAt: string,
) {
  return {
    customerId,
    _count: { _all: orderCount },
    _min: { createdAt: new Date(firstOrderAt) },
    _max: { createdAt: new Date(lastOrderAt) },
  }
}
