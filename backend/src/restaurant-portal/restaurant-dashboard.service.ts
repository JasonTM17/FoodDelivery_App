import { Injectable } from '@nestjs/common'
import { RestaurantAccessService } from './restaurant-access.service'
import { RestaurantInsightsService } from './restaurant-insights.service'
import { RestaurantRevenueService } from './restaurant-revenue.service'
import { PrismaService } from '../database/prisma.service'

@Injectable()
export class RestaurantDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: RestaurantAccessService,
    private readonly revenue: RestaurantRevenueService,
    private readonly insights: RestaurantInsightsService,
  ) {}

  async get(userId: string, days: number) {
    const profile = await this.access.getProfile(userId)
    const restaurantId = profile.restaurantId
    const [summary, insightData, orders, reviews, hiddenItems, promotions] = await Promise.all([
      this.revenue.getSummary(userId, days),
      this.insights.getInsights(userId),
      this.prisma.order.findMany({
        where: { restaurantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { fullName: true } },
          orderItems: { select: { nameSnapshot: true, quantity: true } },
        },
      }),
      this.prisma.review.findMany({
        where: { restaurantId, isHidden: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { fullName: true, avatarUrl: true } } },
      }),
      this.prisma.menuItem.count({ where: { restaurantId, isAvailable: false } }),
      this.prisma.promotion.count({
        where: { restaurantId, status: 'active', startsAt: { lte: new Date() }, expiresAt: { gte: new Date() } },
      }),
    ])
    return {
      store: {
        id: profile.restaurant.id,
        name: profile.restaurant.name,
        isOpen: profile.restaurant.isOpen,
        approvalStatus: profile.restaurant.approvalStatus,
        onboardingCompletedAt: profile.onboardingCompletedAt,
      },
      summary,
      bestSellers: insightData.bestSellers.slice(0, 5),
      recentOrders: orders.map(order => ({
        id: order.id,
        code: order.orderCode,
        status: order.status,
        total: Number(order.total),
        customerName: order.customer.fullName,
        createdAt: order.createdAt,
        items: order.orderItems.map(item => ({ name: item.nameSnapshot, quantity: item.quantity })),
      })),
      latestReviews: reviews.map(review => ({
        id: review.id,
        rating: review.foodRating,
        comment: review.comment,
        customerName: review.customer.fullName,
        customerAvatar: review.customer.avatarUrl,
        createdAt: review.createdAt,
      })),
      alerts: { hiddenItems, activePromotions: promotions },
    }
  }
}
