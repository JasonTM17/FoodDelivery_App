import { ConflictException } from '@nestjs/common'
import { RestaurantPromotionsService } from './restaurant-promotions.service'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'
import { RestaurantPromotionTargetingService } from './restaurant-promotion-targeting.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateRestaurantPromotionDto } from './restaurant-promotion.dto'

const userId = 'user-1'
const restaurantId = 'restaurant-1'

describe('RestaurantPromotionsService', () => {
  const getRestaurantId = jest.fn()
  const findUnique = jest.fn()
  const findMany = jest.fn()
  const findFirstOrThrow = jest.fn()
  const findCustomers = jest.fn()
  const findPromotionUsages = jest.fn()
  const countPromotions = jest.fn()
  const create = jest.fn()
  const createNotification = jest.fn()
  const resolveCustomerIds = jest.fn()

  let service: RestaurantPromotionsService

  beforeEach(() => {
    jest.clearAllMocks()
    getRestaurantId.mockResolvedValue(restaurantId)
    findUnique.mockResolvedValue(null)
    findMany.mockResolvedValue([])
    findFirstOrThrow.mockResolvedValue(makePromotion())
    findCustomers.mockResolvedValue([])
    findPromotionUsages.mockResolvedValue([])
    countPromotions.mockResolvedValue(1)
    create.mockResolvedValue(makePromotion())
    resolveCustomerIds.mockResolvedValue([])

    service = new RestaurantPromotionsService(
      {
        promotion: { findUnique, findMany, findFirstOrThrow, create, count: countPromotions },
        promotionUsage: { findMany: findPromotionUsages },
        user: { findMany: findCustomers },
      } as unknown as PrismaService,
      { getRestaurantId } as unknown as RestaurantAccessService,
      { create: createNotification } as unknown as NotificationsService,
      { resolveCustomerIds } as unknown as RestaurantPromotionTargetingService,
    )
  })

  it('rejects non-stackable promotions when time and item scope overlap', async () => {
    findMany.mockResolvedValue([
      makePromotion({
        id: 'existing',
        items: [{ menuItemId: 'item-a', categoryId: null }],
      }),
    ])

    await expect(service.create(userId, makeDto({ itemIds: ['item-a'] }))).rejects.toThrow(ConflictException)

    expect(create).not.toHaveBeenCalled()
  })

  it('allows a non-stackable promotion when the overlapping window has disjoint item scope', async () => {
    findMany.mockResolvedValue([
      makePromotion({
        id: 'existing',
        items: [{ menuItemId: 'item-b', categoryId: null }],
      }),
    ])

    const result = await service.create(userId, makeDto({ itemIds: ['item-a'] }))

    expect(result.promotion.itemIds).toEqual(['item-a'])
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ restaurantId, isStackable: false }),
    }))
  })

  it('treats all-scope promotions as overlapping every item and category scope', async () => {
    findMany.mockResolvedValue([
      makePromotion({
        id: 'existing',
        items: [],
      }),
    ])

    await expect(service.create(userId, makeDto({
      appliesTo: 'category',
      categoryId: 'category-a',
      itemIds: undefined,
    }))).rejects.toThrow('PROMOTION_SCOPE_OVERLAP')
  })

  it('skips overlap validation for stackable promotions', async () => {
    create.mockResolvedValue(makePromotion({ isStackable: true }))

    const result = await service.create(userId, makeDto({ stackable: true }))

    expect(findMany).not.toHaveBeenCalled()
    expect(result.promotion.stackable).toBe(true)
  })

  it('broadcasts only to customers resolved from the owned restaurant audience', async () => {
    resolveCustomerIds.mockResolvedValue(['customer-a'])
    findCustomers.mockResolvedValue([{ id: 'customer-a' }])

    const result = await service.broadcast(userId, 'promotion-1')

    expect(resolveCustomerIds).toHaveBeenCalledWith(userId, { audience: 'all' })
    expect(findCustomers).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { in: ['customer-a'] } }),
    }))
    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'customer-a' }))
    expect(result).toEqual({ targeted: 1, sent: 1 })
  })

  it('uses the promotion code as the broadcast fallback body instead of runtime-localized copy', async () => {
    findFirstOrThrow.mockResolvedValue(makePromotion({ description: null }))
    resolveCustomerIds.mockResolvedValue(['customer-a'])
    findCustomers.mockResolvedValue([{ id: 'customer-a' }])

    await service.broadcast(userId, 'promotion-1')

    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      body: 'LUNCH10',
    }))
  })

  it('limits notification concurrency while preserving the broadcast result', async () => {
    const customers = Array.from({ length: 101 }, (_, index) => ({ id: `customer-${index}` }))
    let activeNotifications = 0
    let maxConcurrency = 0

    resolveCustomerIds.mockResolvedValue(customers.map(customer => customer.id))
    findCustomers.mockResolvedValue(customers)
    createNotification.mockImplementation(async () => {
      activeNotifications += 1
      maxConcurrency = Math.max(maxConcurrency, activeNotifications)
      await new Promise(resolve => setImmediate(resolve))
      activeNotifications -= 1
      return { id: 'notification' }
    })

    const result = await service.broadcast(userId, 'promotion-1')

    expect(maxConcurrency).toBe(50)
    expect(createNotification).toHaveBeenCalledTimes(101)
    expect(result).toEqual({ targeted: 101, sent: 101 })
  })

  it('returns real analytics for an owned promotion detail', async () => {
    findFirstOrThrow.mockResolvedValue(makePromotion({ usageLimit: 100 }))
    findPromotionUsages.mockResolvedValue([
      makeUsage({ usedAt: new Date('2026-06-05T06:00:00.000Z'), discountAmount: 10_000, order: { total: 100_000 } }),
      makeUsage({ usedAt: new Date('2026-06-05T09:00:00.000Z'), discountAmount: 20_000, order: { total: 200_000 } }),
    ])

    const result = await service.get(userId, 'promotion-1')

    expect(findFirstOrThrow).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'promotion-1', restaurantId },
    }))
    expect(findPromotionUsages).toHaveBeenCalledWith(expect.objectContaining({
      where: { promotionId: 'promotion-1' },
    }))
    expect(result.analytics).toEqual({
      usageCount: 2,
      revenueAttributed: 300_000,
      discountGiven: 30_000,
      redemptionRate: 2,
      roi: 900,
      usageTimeline: [{ date: '2026-06-05', count: 2, revenueAttributed: 300_000, discountGiven: 30_000 }],
    })
  })

  it('returns aggregate promotion analytics in the list response without fake metrics', async () => {
    findMany
      .mockResolvedValueOnce([makePromotion()])
      .mockResolvedValueOnce([
        {
          usageLimit: 50,
          usages: [makeUsage({ discountAmount: 5_000, order: { total: 50_000 } })],
        },
        {
          usageLimit: 2_147_483_647,
          usages: [makeUsage({ discountAmount: 15_000, order: { total: 150_000 } })],
        },
      ])

    const result = await service.list(userId, { page: 1, limit: 20 })

    expect(result.analytics).toMatchObject({
      usageCount: 2,
      revenueAttributed: 200_000,
      discountGiven: 20_000,
      redemptionRate: 4,
      roi: 900,
    })
  })
})

function makeDto(overrides: Partial<CreateRestaurantPromotionDto> = {}): CreateRestaurantPromotionDto {
  return {
    code: 'LUNCH10',
    name: 'Lunch discount',
    description: 'Lunch campaign',
    type: 'percent',
    discountValue: 10,
    appliesTo: 'items',
    itemIds: ['item-a'],
    target: { audience: 'all' },
    schedule: {
      validFrom: '2026-06-01T00:00:00.000Z',
      validUntil: '2026-06-30T23:59:59.000Z',
    },
    channels: ['in_app'],
    stackable: false,
    perUserLimit: 1,
    status: 'active',
    ...overrides,
  }
}

function makePromotion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'promotion-1',
    code: 'LUNCH10',
    name: 'Lunch discount',
    description: 'Lunch campaign',
    type: 'percentage',
    value: 10,
    minOrderAmount: 0,
    maxDiscount: null,
    usageLimit: 100,
    usageCount: 0,
    maxPerUser: 1,
    restaurantId,
    createdById: userId,
    startsAt: new Date('2026-06-01T00:00:00.000Z'),
    expiresAt: new Date('2026-06-30T23:59:59.000Z'),
    status: 'active',
    isActive: true,
    isStackable: false,
    targeting: { audience: 'all' },
    recurrence: null,
    channels: ['in_app'],
    items: [{ menuItemId: 'item-a', categoryId: null }],
    createdAt: new Date('2026-05-20T00:00:00.000Z'),
    ...overrides,
  }
}

function makeUsage(overrides: Record<string, unknown> = {}) {
  return {
    discountAmount: 10_000,
    usedAt: new Date('2026-06-05T00:00:00.000Z'),
    order: { total: 100_000 },
    ...overrides,
  }
}
