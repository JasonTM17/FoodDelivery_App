import { RestaurantRevenueService } from './restaurant-revenue.service'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'

describe('RestaurantRevenueService', () => {
  const getRestaurantId = jest.fn()
  const findMany = jest.fn()
  const aggregate = jest.fn()

  let service: RestaurantRevenueService

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T00:00:00.000Z'))
    jest.clearAllMocks()
    getRestaurantId.mockResolvedValue('restaurant-1')
    aggregate.mockResolvedValue({ _sum: { total: 0 } })
    findMany.mockResolvedValue([
      {
        id: 'order-1',
        createdAt: new Date('2026-06-05T06:00:00.000Z'),
        total: 300_000,
        paymentMethod: 'mock_wallet',
        promotionDiscount: 0,
        orderItems: [
          {
            unitPrice: 100_000,
            quantity: 2,
            menuItem: { category: { id: 'category-pizza', name: 'Pizza' } },
          },
          {
            unitPrice: 25_000,
            quantity: 2,
            menuItem: { category: { id: 'category-drinks', name: 'Drinks' } },
          },
        ],
      },
    ])

    service = new RestaurantRevenueService(
      { order: { findMany, aggregate } } as unknown as PrismaService,
      { getRestaurantId } as unknown as RestaurantAccessService,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('attributes category revenue by each order item value instead of splitting order total evenly', async () => {
    const result = await service.getSummary('user-1', 7)

    expect(result.total).toEqual({ vnd: 300_000, orderCount: 1 })
    expect(result.byCategory).toEqual([
      { categoryId: 'category-pizza', name: 'Pizza', vnd: 200_000, pct: 80 },
      { categoryId: 'category-drinks', name: 'Drinks', vnd: 50_000, pct: 20 },
    ])
    expect(result.byPayment).toEqual([{ method: 'wallet', vnd: 300_000, pct: 100 }])
  })
})
