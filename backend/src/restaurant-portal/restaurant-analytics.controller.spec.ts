import { BadRequestException } from '@nestjs/common'
import { RestaurantAnalyticsController } from './restaurant-analytics.controller'
import { RestaurantDashboardService } from './restaurant-dashboard.service'
import { RestaurantInsightsService } from './restaurant-insights.service'
import { RestaurantRevenueService } from './restaurant-revenue.service'

describe('RestaurantAnalyticsController', () => {
  const dashboard = { get: jest.fn() }
  const revenue = { getSummary: jest.fn(), getBreakdown: jest.fn() }
  const insights = { getInsights: jest.fn() }

  const controller = new RestaurantAnalyticsController(
    dashboard as unknown as RestaurantDashboardService,
    revenue as unknown as RestaurantRevenueService,
    insights as unknown as RestaurantInsightsService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    insights.getInsights.mockResolvedValue({
      suggestions: [{ id: 'suggestion-1' }],
      peakHours: [{ hour: 12, orders: 4 }],
      bestSellers: [{ name: 'Pho', quantity: 8 }],
      slowMovers: [{ name: 'Salad', quantity: 1 }],
      forecast: [{ date: '2026-07-08', revenue: 150000 }],
    })
  })

  it('returns only the requested analytics section', async () => {
    await expect(
      controller.getInsightSection({ sub: 'owner-1', role: 'restaurant' }, 'best-sellers'),
    ).resolves.toEqual([{ name: 'Pho', quantity: 8 }])

    expect(insights.getInsights).toHaveBeenCalledWith('owner-1')
  })

  it('rejects unknown analytics sections instead of returning a fake empty list', async () => {
    await expect(
      controller.getInsightSection({ sub: 'owner-1', role: 'restaurant' }, 'made-up-section'),
    ).rejects.toThrow(BadRequestException)

    expect(insights.getInsights).not.toHaveBeenCalled()
  })
})
