import { Injectable } from '@nestjs/common'
import { OrderStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'

const COMPLETED: OrderStatus[] = [OrderStatus.delivered, OrderStatus.completed]

@Injectable()
export class RestaurantInsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: RestaurantAccessService,
  ) {}

  async getBenchmark(userId: string) {
    const profile = await this.access.getProfile(userId)
    const restaurant = profile.restaurant
    const peers = await this.prisma.restaurant.findMany({
      where: {
        id: { not: restaurant.id },
        isActive: true,
        approvalStatus: 'approved',
        priceRange: restaurant.priceRange,
        cuisineTypes: { hasSome: restaurant.cuisineTypes },
      },
      select: { id: true },
      take: 100,
    })
    const useCohort = peers.length >= 10
    const cohortIds = useCohort
      ? peers.map(peer => peer.id)
      : (await this.prisma.restaurant.findMany({
          where: { id: { not: restaurant.id }, isActive: true, approvalStatus: 'approved' },
          select: { id: true },
          take: 250,
        })).map(peer => peer.id)
    const since = new Date(Date.now() - 90 * 86_400_000)
    const [own, industry] = await Promise.all([
      this.getMetrics([restaurant.id], since),
      this.getMetrics(cohortIds, since),
    ])
    return {
      restaurant: own,
      industry,
      cohortSize: cohortIds.length,
      source: useCohort ? 'cohort' : 'platform',
      updatedAt: new Date().toISOString(),
    }
  }

  async getInsights(userId: string) {
    const restaurantId = await this.access.getRestaurantId(userId)
    const now = new Date()
    const since = new Date(now.getTime() - 30 * 86_400_000)
    const previousWeekStart = new Date(now.getTime() - 14 * 86_400_000)
    const currentWeekStart = new Date(now.getTime() - 7 * 86_400_000)
    const [orders, menuItems, previousItems] = await Promise.all([
      this.prisma.order.findMany({
        where: { restaurantId, status: { in: COMPLETED }, createdAt: { gte: since } },
        select: { id: true, createdAt: true, total: true, actualDeliveryTimeMinutes: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.menuItem.findMany({
        where: { restaurantId },
        select: {
          id: true, name: true, isAvailable: true,
          orderItems: {
            where: { order: { status: { in: COMPLETED }, createdAt: { gte: since } } },
            select: { quantity: true, unitPrice: true, order: { select: { createdAt: true } } },
          },
        },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            restaurantId, status: { in: COMPLETED },
            createdAt: { gte: previousWeekStart, lt: currentWeekStart },
          },
        },
        select: { menuItemId: true, quantity: true },
      }),
    ])

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const previousCounts = countItems(previousItems)
    const bestSellers = menuItems.map(item => {
      const currentWeekCount = item.orderItems
        .filter(row => row.order.createdAt >= currentWeekStart)
        .reduce((sum, row) => sum + row.quantity, 0)
      const orderCount = item.orderItems.reduce((sum, row) => sum + row.quantity, 0)
      const revenue = item.orderItems.reduce((sum, row) => sum + Number(row.unitPrice) * row.quantity, 0)
      return {
        itemId: item.id,
        name: item.name,
        orderCount,
        revenueShare: totalRevenue ? round1(revenue / totalRevenue * 100) : 0,
        trendVsLastWeek: percentageChange(currentWeekCount, previousCounts.get(item.id) ?? 0),
      }
    }).sort((a, b) => b.orderCount - a.orderCount)

    const peakHoursMap = new Map<string, number>()
    for (const order of orders) {
      const key = `${order.createdAt.getDay()}:${order.createdAt.getHours()}`
      peakHoursMap.set(key, (peakHoursMap.get(key) ?? 0) + 1)
    }
    const peakHours = Array.from(peakHoursMap, ([key, orderCount]) => {
      const [day, hour] = key.split(':').map(Number)
      return { day, hour, orderCount }
    })
    const slowMovers = bestSellers.filter(item => item.orderCount <= 1).map(item => ({
      itemId: item.itemId,
      name: item.name,
      ordersInPeriod: item.orderCount,
      period: 30,
      pctDecline: Math.max(0, -item.trendVsLastWeek),
      recommendation: item.orderCount === 0 ? 'remove' : 'bundle',
    }))
    const forecast = buildForecast(orders, now)
    const unavailableCount = menuItems.filter(item => !item.isAvailable).length
    const avgDelivery = average(orders.map(order => order.actualDeliveryTimeMinutes).filter(isNumber))
    const suggestions = [
      ...(unavailableCount > 0 ? [{
        id: 'menu-availability',
        type: 'menu_mix',
        titleKey: 'catalog.menuAvailability.title',
        descriptionKey: 'catalog.menuAvailability.description',
        predictedImpactKey: 'catalog.menuAvailability.impact',
        params: { count: unavailableCount },
        actionable: true,
      }] : []),
      ...(avgDelivery > 35 ? [{
        id: 'delivery-time',
        type: 'operations',
        titleKey: 'catalog.deliveryTime.title',
        descriptionKey: 'catalog.deliveryTime.description',
        predictedImpactKey: 'catalog.deliveryTime.impact',
        params: { minutes: Math.round(avgDelivery) },
        actionable: true,
      }] : []),
    ]
    return { suggestions, peakHours, bestSellers: bestSellers.slice(0, 10), slowMovers, forecast }
  }

  private async getMetrics(restaurantIds: string[], since: Date) {
    if (restaurantIds.length === 0) return { avgOrderValue: 0, repeatCustomerRate: 0 }
    const where: Prisma.OrderWhereInput = {
      restaurantId: { in: restaurantIds }, status: { in: COMPLETED }, createdAt: { gte: since },
    }
    const [aggregate, customers] = await Promise.all([
      this.prisma.order.aggregate({ where, _avg: { total: true } }),
      this.prisma.order.groupBy({ by: ['customerId'], where, _count: { _all: true } }),
    ])
    const repeatCustomers = customers.filter(customer => customer._count._all > 1).length
    return {
      avgOrderValue: Math.round(Number(aggregate._avg.total ?? 0)),
      repeatCustomerRate: customers.length ? round1(repeatCustomers / customers.length * 100) : 0,
    }
  }
}

function countItems(rows: Array<{ menuItemId: string; quantity: number }>): Map<string, number> {
  const counts = new Map<string, number>()
  rows.forEach(row => counts.set(row.menuItemId, (counts.get(row.menuItemId) ?? 0) + row.quantity))
  return counts
}

function buildForecast(orders: Array<{ createdAt: Date; total: Prisma.Decimal }>, now: Date) {
  const totals = new Map<string, number>()
  orders.forEach(order => {
    const date = order.createdAt.toISOString().slice(0, 10)
    totals.set(date, (totals.get(date) ?? 0) + Number(order.total))
  })
  const weekday = new Map<number, number[]>()
  totals.forEach((value, date) => {
    const day = new Date(`${date}T00:00:00Z`).getUTCDay()
    weekday.set(day, [...(weekday.get(day) ?? []), value])
  })
  return Array.from({ length: 7 }).flatMap((_, index) => {
    const date = new Date(now.getTime() + (index + 1) * 86_400_000)
    const samples = weekday.get(date.getUTCDay()) ?? []
    if (samples.length === 0) return []

    const predicted = Math.round(average(samples))
    return [{
      date: date.toISOString().slice(0, 10),
      predicted,
      lower: Math.max(0, Math.round(predicted * 0.85)),
      upper: Math.round(predicted * 1.15),
    }]
  })
}

function percentageChange(current: number, previous: number): number {
  return previous > 0 ? round1((current - previous) / previous * 100) : 0
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function isNumber(value: number | null): value is number { return value !== null }
function round1(value: number): number { return Math.round(value * 10) / 10 }
