import { RestaurantInsightsService } from './restaurant-insights.service'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'

describe('RestaurantInsightsService', () => {
  const getProfile = jest.fn()
  const getRestaurantId = jest.fn()
  const restaurantFindMany = jest.fn()
  const orderFindMany = jest.fn()
  const menuItemFindMany = jest.fn()
  const orderItemFindMany = jest.fn()
  const aggregate = jest.fn()
  const groupBy = jest.fn()

  let service: RestaurantInsightsService

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T00:00:00.000Z'))
    jest.clearAllMocks()
    getRestaurantId.mockResolvedValue('restaurant-1')
    getProfile.mockResolvedValue({
      restaurant: {
        id: 'restaurant-1',
        priceRange: 'medium',
        cuisineTypes: ['pizza', 'drinks'],
      },
    })
    aggregate.mockResolvedValue({ _avg: { total: 120_000 } })
    groupBy.mockResolvedValue([
      { customerId: 'customer-1', _count: { _all: 2 } },
      { customerId: 'customer-2', _count: { _all: 1 } },
    ])

    service = new RestaurantInsightsService(
      {
        restaurant: { findMany: restaurantFindMany },
        order: { aggregate, groupBy, findMany: orderFindMany },
        menuItem: { findMany: menuItemFindMany },
        orderItem: { findMany: orderItemFindMany },
      } as unknown as PrismaService,
      { getProfile, getRestaurantId } as unknown as RestaurantAccessService,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('uses platform aggregate when the comparable cohort has fewer than 10 restaurants', async () => {
    restaurantFindMany
      .mockResolvedValueOnce(Array.from({ length: 9 }, (_, index) => ({ id: `peer-${index}` })))
      .mockResolvedValueOnce([{ id: 'platform-1' }, { id: 'platform-2' }])

    const result = await service.getBenchmark('user-1')

    expect(result.source).toBe('platform')
    expect(result.cohortSize).toBe(2)
    expect(result.industry).toEqual({ avgOrderValue: 120_000, repeatCustomerRate: 50 })
    expect(result).not.toHaveProperty('peers')
    expect(restaurantFindMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({
        priceRange: 'medium',
        cuisineTypes: { hasSome: ['pizza', 'drinks'] },
      }),
    }))
  })

  it('uses the comparable cohort when at least 10 restaurants qualify', async () => {
    restaurantFindMany.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, index) => ({ id: `peer-${index}` })),
    )

    const result = await service.getBenchmark('user-1')

    expect(result.source).toBe('cohort')
    expect(result.cohortSize).toBe(10)
    expect(restaurantFindMany).toHaveBeenCalledTimes(1)
  })

  it('returns translation keys and params instead of runtime-localized suggestion copy', async () => {
    orderFindMany.mockResolvedValue([
      {
        id: 'order-1',
        createdAt: new Date('2026-06-09T12:00:00.000Z'),
        total: 100_000,
        actualDeliveryTimeMinutes: 42,
      },
    ])
    menuItemFindMany.mockResolvedValue([
      { id: 'item-1', name: 'Hidden item', isAvailable: false, orderItems: [] },
    ])
    orderItemFindMany.mockResolvedValue([])

    const result = await service.getInsights('user-1')

    expect(result.suggestions).toEqual([
      expect.objectContaining({
        id: 'menu-availability',
        type: 'menu_mix',
        titleKey: 'catalog.menuAvailability.title',
        descriptionKey: 'catalog.menuAvailability.description',
        predictedImpactKey: 'catalog.menuAvailability.impact',
        params: { count: 1 },
        actionable: true,
      }),
      expect.objectContaining({
        id: 'delivery-time',
        type: 'operations',
        titleKey: 'catalog.deliveryTime.title',
        descriptionKey: 'catalog.deliveryTime.description',
        predictedImpactKey: 'catalog.deliveryTime.impact',
        params: { minutes: 42 },
        actionable: true,
      }),
    ])
    expect(result.suggestions[0]).not.toHaveProperty('title')
    expect(result.suggestions[0]).not.toHaveProperty('description')
    expect(result.suggestions[0]).not.toHaveProperty('predictedImpact')
  })
})
