import { Injectable } from '@nestjs/common'
import { OrderStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'
import { toPublicPaymentMethod } from '../orders/payment-methods'

const REVENUE_STATUSES: OrderStatus[] = [OrderStatus.delivered, OrderStatus.completed]

@Injectable()
export class RestaurantRevenueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: RestaurantAccessService,
  ) {}

  async getSummary(userId: string, requestedDays: number) {
    const restaurantId = await this.access.getRestaurantId(userId)
    const days = Math.min(Math.max(requestedDays || 7, 1), 365)
    const end = new Date()
    const start = new Date(end.getTime() - days * 86_400_000)
    const previousStart = new Date(start.getTime() - days * 86_400_000)
    const monthStart = new Date(start.getTime() - 30 * 86_400_000)
    const monthEnd = new Date(end.getTime() - 30 * 86_400_000)

    const [orders, previous, previousMonth] = await Promise.all([
      this.prisma.order.findMany({
        where: { restaurantId, status: { in: REVENUE_STATUSES }, createdAt: { gte: start, lt: end } },
        include: { orderItems: { include: { menuItem: { include: { category: true } } } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.sumRevenue(restaurantId, previousStart, start),
      this.sumRevenue(restaurantId, monthStart, monthEnd),
    ])

    const total = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const byDayMap = new Map<string, { vnd: number; orderCount: number }>()
    const byHourMap = new Map<number, { vnd: number; orderCount: number }>()
    const categoryMap = new Map<string, { name: string; vnd: number }>()
    const paymentMap = new Map<string, number>()
    let promotionRevenue = 0

    for (const order of orders) {
      const date = order.createdAt.toISOString().slice(0, 10)
      const day = byDayMap.get(date) ?? { vnd: 0, orderCount: 0 }
      day.vnd += Number(order.total); day.orderCount += 1; byDayMap.set(date, day)
      const hour = order.createdAt.getHours()
      const hourData = byHourMap.get(hour) ?? { vnd: 0, orderCount: 0 }
      hourData.vnd += Number(order.total); hourData.orderCount += 1; byHourMap.set(hour, hourData)
      const payment = toPublicPaymentMethod(order.paymentMethod)
      paymentMap.set(payment, (paymentMap.get(payment) ?? 0) + Number(order.total))
      if (Number(order.promotionDiscount) > 0) promotionRevenue += Number(order.total)

      for (const item of order.orderItems) {
        const category = item.menuItem.category
        const value = Number(item.unitPrice) * item.quantity
        const current = categoryMap.get(category.id) ?? { name: category.name, vnd: 0 }
        current.vnd += value
        categoryMap.set(category.id, current)
      }
    }

    const attributedTotal = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.vnd, 0)
    const organicRevenue = Math.max(total - promotionRevenue, 0)
    return {
      total: { vnd: total, orderCount: orders.length },
      avg: {
        orderValue: orders.length ? Math.round(total / orders.length) : 0,
        perDay: Math.round(total / days),
      },
      delta: {
        vsYesterday: days === 1 ? await this.getYesterdayDelta(restaurantId, total, start) : null,
        vsLastWeek: percentageChange(total, previous),
        vsLastMonth: percentageChange(total, previousMonth),
      },
      byDay: dateRange(start, days).map(date => ({ date, ...(byDayMap.get(date) ?? { vnd: 0, orderCount: 0 }) })),
      byCategory: Array.from(categoryMap, ([categoryId, item]) => ({
        categoryId,
        name: item.name,
        vnd: item.vnd,
        pct: attributedTotal ? round1(item.vnd / attributedTotal * 100) : 0,
      })).sort((a, b) => b.vnd - a.vnd),
      byHour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        ...(byHourMap.get(hour) ?? { vnd: 0, orderCount: 0 }),
      })),
      bySource: toPercentageRows({ organic: organicRevenue, promotion: promotionRevenue }, total, 'source'),
      byPayment: toPercentageRows(Object.fromEntries(paymentMap), total, 'method'),
    }
  }

  async getBreakdown(userId: string, startDate: string, endDate: string) {
    const restaurantId = await this.access.getRestaurantId(userId)
    const start = new Date(`${startDate}T00:00:00.000Z`)
    const end = new Date(`${endDate}T23:59:59.999Z`)
    const [orders, firstOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { restaurantId, status: { in: REVENUE_STATUSES }, createdAt: { gte: start, lte: end } },
        select: {
          customerId: true, createdAt: true, subtotal: true, deliveryFee: true,
          promotionDiscount: true, total: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { restaurantId, status: { in: REVENUE_STATUSES }, createdAt: { lte: end } },
        _min: { createdAt: true },
      }),
    ])
    const firstOrderDate = new Map(firstOrders.map(row => [row.customerId, row._min.createdAt?.toISOString().slice(0, 10)]))
    const rows = new Map<string, { orders: number; gross: number; discount: number; net: number; newCustomers: Set<string>; returning: Set<string> }>()
    for (const order of orders) {
      const date = order.createdAt.toISOString().slice(0, 10)
      const row = rows.get(date) ?? { orders: 0, gross: 0, discount: 0, net: 0, newCustomers: new Set(), returning: new Set() }
      row.orders += 1
      row.gross += Number(order.subtotal) + Number(order.deliveryFee)
      row.discount += Number(order.promotionDiscount)
      row.net += Number(order.total)
      if (firstOrderDate.get(order.customerId) === date) row.newCustomers.add(order.customerId)
      else row.returning.add(order.customerId)
      rows.set(date, row)
    }
    const data = Array.from(rows, ([date, row]) => ({
      date, orders: row.orders, gross: row.gross, discount: row.discount, net: row.net,
      avgOrder: row.orders ? Math.round(row.net / row.orders) : 0,
      newCustomers: row.newCustomers.size, returning: row.returning.size,
    })).sort((a, b) => b.date.localeCompare(a.date))
    return { rows: data, total: data.length }
  }

  private async sumRevenue(restaurantId: string, gte: Date, lt: Date): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: { restaurantId, status: { in: REVENUE_STATUSES }, createdAt: { gte, lt } },
      _sum: { total: true },
    })
    return Number(result._sum.total ?? 0)
  }

  private async getYesterdayDelta(restaurantId: string, current: number, today: Date) {
    const previous = await this.sumRevenue(
      restaurantId,
      new Date(today.getTime() - 86_400_000),
      today,
    )
    return percentageChange(current, previous)
  }
}

function percentageChange(current: number, previous: number): number | null {
  return previous > 0 ? round1((current - previous) / previous * 100) : null
}

function round1(value: number): number { return Math.round(value * 10) / 10 }

function dateRange(start: Date, days: number): string[] {
  return Array.from({ length: days }, (_, index) =>
    new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10))
}

function toPercentageRows(values: Record<string, number>, total: number, key: 'source' | 'method') {
  return Object.entries(values).map(([name, vnd]) => ({ [key]: name, vnd, pct: total ? round1(vnd / total * 100) : 0 }))
}
