import { ConflictException } from '@nestjs/common'
import { RestaurantPromotionsService } from './restaurant-promotions.service'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateRestaurantPromotionDto } from './restaurant-promotion.dto'

const userId = 'user-1'
const restaurantId = 'restaurant-1'

describe('RestaurantPromotionsService', () => {
  const getRestaurantId = jest.fn()
  const findUnique = jest.fn()
  const findMany = jest.fn()
  const create = jest.fn()

  let service: RestaurantPromotionsService

  beforeEach(() => {
    jest.clearAllMocks()
    getRestaurantId.mockResolvedValue(restaurantId)
    findUnique.mockResolvedValue(null)
    findMany.mockResolvedValue([])
    create.mockResolvedValue(makePromotion())

    service = new RestaurantPromotionsService(
      { promotion: { findUnique, findMany, create } } as unknown as PrismaService,
      { getRestaurantId } as unknown as RestaurantAccessService,
      { create: jest.fn() } as unknown as NotificationsService,
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
