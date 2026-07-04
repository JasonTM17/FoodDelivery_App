import { Injectable } from '@nestjs/common'
import { OrderStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'

const REVENUE_STATUSES: OrderStatus[] = [OrderStatus.delivered, OrderStatus.completed]

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(period: string) {
    const days = parsePeriod(period)
    const end = new Date()
    const start = new Date(end.getTime() - days * 86_400_000)
    const previousStart = new Date(start.getTime() - days * 86_400_000)
    const [orders, previousOrders, totalUsers, totalRestaurants, activeDrivers] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: start, lt: end } }, select: { total: true, status: true, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: previousStart, lt: start } }, select: { total: true, status: true },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.restaurant.count({ where: { isActive: true, approvalStatus: 'approved' } }),
      this.prisma.driverProfile.count({ where: { isOnline: true } }),
    ])
    const revenue = sumRevenue(orders)
    const previousRevenue = sumRevenue(previousOrders)
    const dailyRevenue = groupDailyRevenue(orders, start, days)
    const dailyOrders = groupDailyOrders(orders, start, days)
    return {
      kpis: [
        kpi('revenue', 'Revenue', revenue, formatVnd(revenue), percentageRatio(revenue, previousRevenue), dailyRevenue, '/analytics'),
        kpi('orders', 'Orders', orders.length, orders.length.toLocaleString('en-US'), percentageRatio(orders.length, previousOrders.length), dailyOrders, '/orders'),
        kpi('users', 'Active users', totalUsers, totalUsers.toLocaleString('en-US'), 0, [], '/users'),
        kpi('restaurants', 'Restaurants', totalRestaurants, totalRestaurants.toLocaleString('en-US'), 0, [], '/restaurants'),
        kpi('drivers', 'Online drivers', activeDrivers, activeDrivers.toLocaleString('en-US'), 0, [], '/drivers'),
      ],
    }
  }

  async getCharts(period: string) {
    const days = parsePeriod(period)
    const end = new Date()
    const start = new Date(end.getTime() - days * 86_400_000)
    const previousStart = new Date(start.getTime() - days * 86_400_000)
    const [orders, previousOrders, restaurants, driverRows, retention] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { createdAt: true, status: true, total: true, restaurantId: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: previousStart, lt: start } },
        select: { createdAt: true, status: true, total: true },
      }),
      this.prisma.restaurant.findMany({
        where: { orders: { some: { createdAt: { gte: start }, status: { in: REVENUE_STATUSES } } } },
        select: { id: true, name: true, rating: true }, take: 100,
      }),
      this.prisma.$queryRaw<Array<{ hour: number; count: number }>>`
        SELECT EXTRACT(HOUR FROM recorded_at)::int AS hour,
               COUNT(DISTINCT driver_id)::int AS count
        FROM driver_location_history
        WHERE recorded_at >= ${start}
        GROUP BY EXTRACT(HOUR FROM recorded_at)
        ORDER BY hour`,
      this.getRetentionCohorts(start, end, days),
    ])
    const previousByDay = groupByRelativeDay(previousOrders, previousStart)
    const revenue = dateRange(start, days).map((date, index) => ({
      date,
      revenue: orders.filter(order => dateKey(order.createdAt) === date && REVENUE_STATUSES.includes(order.status))
        .reduce((sum, order) => sum + Number(order.total), 0),
      prevRevenue: previousByDay.get(index) ?? 0,
    }))
    const orderStatus = dateRange(start, days).map(date => {
      const daily = orders.filter(order => dateKey(order.createdAt) === date)
      return { date, ...groupStatuses(daily.map(order => order.status)) }
    })
    const restaurantMap = new Map(restaurants.map(restaurant => [restaurant.id, restaurant]))
    const restaurantTotals = new Map<string, { revenue: number; orderCount: number }>()
    orders.filter(order => REVENUE_STATUSES.includes(order.status)).forEach(order => {
      const value = restaurantTotals.get(order.restaurantId) ?? { revenue: 0, orderCount: 0 }
      value.revenue += Number(order.total); value.orderCount += 1
      restaurantTotals.set(order.restaurantId, value)
    })
    const topRestaurants = Array.from(restaurantTotals, ([id, value]) => ({
      id, name: restaurantMap.get(id)?.name ?? id, rating: Number(restaurantMap.get(id)?.rating ?? 0), ...value,
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    return {
      revenue,
      orderStatus,
      driverOnline: driverRows,
      topRestaurants,
      retention,
      heatmap: await this.getOrderHeatmap(start),
    }
  }

  async getRetentionCohorts(start: Date, end: Date, days: number) {
    const rows = await this.prisma.$queryRaw<Array<{
      date: string
      new_customers: number | bigint
      retained_customers: number | bigint
    }>>`
      WITH first_orders AS (
        SELECT customer_id, MIN(created_at)::date AS cohort_date
        FROM orders
        GROUP BY customer_id
      ),
      cohort_customers AS (
        SELECT customer_id, cohort_date
        FROM first_orders
        WHERE cohort_date >= CAST(${start} AS date)
          AND cohort_date < CAST(${end} AS date)
      ),
      retained_customers AS (
        SELECT DISTINCT cohort_customers.customer_id, cohort_customers.cohort_date
        FROM cohort_customers
        JOIN orders AS repeat_orders
          ON repeat_orders.customer_id = cohort_customers.customer_id
         AND repeat_orders.created_at::date > cohort_customers.cohort_date
         AND repeat_orders.created_at < ${end}
      )
      SELECT cohort_customers.cohort_date::text AS date,
             COUNT(cohort_customers.customer_id)::int AS new_customers,
             COUNT(retained_customers.customer_id)::int AS retained_customers
      FROM cohort_customers
      LEFT JOIN retained_customers
        ON retained_customers.customer_id = cohort_customers.customer_id
       AND retained_customers.cohort_date = cohort_customers.cohort_date
      GROUP BY cohort_customers.cohort_date
      ORDER BY cohort_customers.cohort_date`
    const byDate = new Map(rows.map(row => {
      const newCustomers = toInteger(row.new_customers)
      const retainedCustomers = toInteger(row.retained_customers)
      return [row.date, { newCustomers, retainedCustomers }]
    }))
    return dateRange(start, days).map(date => {
      const row = byDate.get(date) ?? { newCustomers: 0, retainedCustomers: 0 }
      return {
        date,
        newCustomers: row.newCustomers,
        retainedCustomers: row.retainedCustomers,
        retentionRate: row.newCustomers > 0 ? round1(row.retainedCustomers / row.newCustomers * 100) : 0,
      }
    })
  }

  async getOrderHeatmap(since: Date) {
    return this.prisma.$queryRaw<Array<{ day: number; hour: number; count: number }>>`
      SELECT ((EXTRACT(DOW FROM created_at)::int + 6) % 7) AS day,
             EXTRACT(HOUR FROM created_at)::int AS hour,
             COUNT(*)::int AS count
      FROM orders
      WHERE created_at >= ${since}
      GROUP BY day, hour
      ORDER BY day, hour`
  }

  async getRecentOrders(limit: number) {
    const orders = await this.prisma.order.findMany({
      take: Math.min(Math.max(limit, 1), 100), orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { fullName: true } },
        restaurant: { select: { name: true } },
        driver: { select: { fullName: true } },
      },
    })
    return { orders: orders.map(order => ({
      id: order.id, orderCode: order.orderCode, status: order.status, total: Number(order.total),
      customer: { name: order.customer.fullName }, restaurant: { name: order.restaurant.name },
      driver: order.driver ? { name: order.driver.fullName } : null, placedAt: order.createdAt,
    })) }
  }
}

function parsePeriod(period: string): number {
  if (period === 'today') return 1
  const parsed = Number.parseInt(period, 10)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 365) : 30
}
function dateKey(date: Date): string { return date.toISOString().slice(0, 10) }
function dateRange(start: Date, days: number) { return Array.from({ length: days }, (_, index) => dateKey(new Date(start.getTime() + index * 86_400_000))) }
function sumRevenue(orders: Array<{ status: OrderStatus; total: unknown }>) { return orders.filter(order => REVENUE_STATUSES.includes(order.status)).reduce((sum, order) => sum + Number(order.total), 0) }
function groupDailyRevenue(orders: Array<{ createdAt: Date; status: OrderStatus; total: unknown }>, start: Date, days: number) { return dateRange(start, days).map(date => sumRevenue(orders.filter(order => dateKey(order.createdAt) === date))) }
function groupDailyOrders(orders: Array<{ createdAt: Date }>, start: Date, days: number) { return dateRange(start, days).map(date => orders.filter(order => dateKey(order.createdAt) === date).length) }
function groupByRelativeDay(orders: Array<{ createdAt: Date; status: OrderStatus; total: unknown }>, start: Date) { const map = new Map<number, number>(); orders.forEach(order => { if (!REVENUE_STATUSES.includes(order.status)) return; const index = Math.floor((order.createdAt.getTime() - start.getTime()) / 86_400_000); map.set(index, (map.get(index) ?? 0) + Number(order.total)) }); return map }
function groupStatuses(statuses: OrderStatus[]) { const counts = { pending: 0, confirmed: 0, delivering: 0, completed: 0, cancelled: 0 }; statuses.forEach(status => { if (['created', 'pending_payment', 'paid', 'restaurant_pending'].includes(status)) counts.pending += 1; else if (['restaurant_accepted', 'preparing', 'ready_for_pickup'].includes(status)) counts.confirmed += 1; else if (['driver_assigned', 'driver_arriving_restaurant', 'picked_up', 'delivering'].includes(status)) counts.delivering += 1; else if (['delivered', 'completed'].includes(status)) counts.completed += 1; else counts.cancelled += 1 }); return counts }
function percentageRatio(current: number, previous: number) { return previous > 0 ? (current - previous) / previous : 0 }
function round1(value: number) { return Math.round(value * 10) / 10 }
function toInteger(value: number | bigint) { return typeof value === 'bigint' ? Number(value) : Math.trunc(value) }
function formatVnd(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value) }
function kpi(key: string, label: string, value: number, formattedValue: string, delta: number, sparkline: number[], drillDownHref: string) { return { key, label, value, formattedValue, delta, sparkline, drillDownHref } }
