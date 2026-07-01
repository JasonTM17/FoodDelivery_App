import { RestaurantInsightsService } from './restaurant-insights.service'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'

describe('RestaurantInsightsService', () => {
  const getProfile = jest.fn()
  const restaurantFindMany = jest.fn()
  const aggregate = jest.fn()
  const groupBy = jest.fn()

  let service: RestaurantInsightsService

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T00:00:00.000Z'))
    jest.clearAllMocks()
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
        order: { aggregate, groupBy },
      } as unknown as PrismaService,
      { getProfile } as unknown as RestaurantAccessService,
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
})
