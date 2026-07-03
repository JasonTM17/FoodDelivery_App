import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import Redis from 'ioredis'

export interface DriverHeatmapQuery {
  lat: number
  lng: number
  radiusKm?: number
  window?: string
}

export interface DriverHeatmapPoint {
  lat: number
  lng: number
  demandLevel: 0 | 1 | 2
  orderCount: number
  avgPayout: number
}

export interface DriverDailyEarning {
  date: string
  amount: number
  tripCount: number
}

export interface DriverEarningsSummary {
  period: '7d' | '30d' | '90d'
  totalVnd: number
  tripCount: number
  avgPerTrip: number
  byDay: DriverDailyEarning[]
}

export interface DriverRatingReview {
  id: string
  customerName: string
  customerAvatarUrl: string | null
  rating: number
  comment: string | null
  date: string
  orderId: string
  orderCode: string
}

export interface DriverRatingStats {
  average: number
  totalReviews: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

export interface DriverRatingsResponse {
  reviews: DriverRatingReview[]
  stats: DriverRatingStats
  hasMore: boolean
}

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async goOnline(driverId: string, lat: number, lng: number): Promise<void> {
    const profile = await this.prisma.driverProfile.findUniqueOrThrow({ where: { userId: driverId } })
    if (!profile.isVerified) throw new BadRequestException('DRIVER_NOT_VERIFIED')
    const now = new Date().toISOString()

    await this.redis.geoadd('drivers:active', lng, lat, `driver:${driverId}`)
    await this.redis.set(`driver:${driverId}:status`, 'online')
    await this.redis.setex(`driver:${driverId}:alive`, 35, '1')
    await this.redis.setex(`driver:${driverId}:last_seen_at`, 35, now)
    await this.redis.set(`driver:${driverId}:rating`, profile.rating.toString())
    await this.redis.set(`driver:${driverId}:current_order`, '')

    await this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: { isOnline: true, currentLat: lat, currentLng: lng },
    })
  }

  async goOffline(driverId: string): Promise<void> {
    // ZREM is correct for geo keys — GEOADD stores members in a sorted set internally.
    // Redis does not have a separate GEO-removal command.
    await this.redis.zrem('drivers:active', `driver:${driverId}`)
    await this.redis.del(`driver:${driverId}:status`)
    await this.redis.del(`driver:${driverId}:alive`)
    await this.redis.del(`driver:${driverId}:last_seen_at`)
    await this.redis.del(`driver:${driverId}:current_order`)

    await this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: { isOnline: false },
    })
  }

  async getEarnings(driverId: string, period: 'today' | 'week' | 'month'): Promise<{
    totalEarnings: number; totalOrders: number; averagePerOrder: number;
  }> {
    const now = new Date()
    let startDate: Date
    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'completed',
        paidAt: { gte: startDate },
        order: { driverId },
      },
      select: { amount: true },
    })

    const totalEarnings = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const totalOrders = payments.length

    return {
      totalEarnings,
      totalOrders,
      averagePerOrder: totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0,
    }
  }

  async getEarningsSummary(driverId: string, period: string | undefined): Promise<DriverEarningsSummary> {
    const normalizedPeriod = normalizeEarningsPeriod(period)
    const days = earningsPeriodDays(normalizedPeriod)
    const end = startOfToday()
    const start = addDays(end, -(days - 1))
    const rows = await this.prisma.$queryRaw<Array<{
      date: string
      amount: number
      tripCount: number
    }>>(Prisma.sql`
      SELECT
        DATE(pl.created_at)::text AS "date",
        COALESCE(SUM(pl.amount)::float8, 0) AS "amount",
        COUNT(DISTINCT CASE WHEN pl.amount > 0 THEN pl.order_id END)::int AS "tripCount"
      FROM payout_ledger pl
      WHERE pl.recipient_type = 'driver'
        AND pl.recipient_id = CAST(${driverId} AS uuid)
        AND pl.created_at >= ${start}
        AND pl.created_at < ${addDays(end, 1)}
      GROUP BY DATE(pl.created_at)
      ORDER BY DATE(pl.created_at)
    `)
    const byDate = new Map(rows.map(row => [
      row.date,
      {
        amount: Math.round(Number(row.amount)),
        tripCount: Number(row.tripCount),
      },
    ]))
    const byDay = Array.from({ length: days }, (_, index) => {
      const date = dateKey(addDays(start, index))
      const day = byDate.get(date) ?? { amount: 0, tripCount: 0 }
      return { date, amount: day.amount, tripCount: day.tripCount }
    })
    const totalVnd = byDay.reduce((sum, day) => sum + day.amount, 0)
    const tripCount = byDay.reduce((sum, day) => sum + day.tripCount, 0)
    return {
      period: normalizedPeriod,
      totalVnd,
      tripCount,
      avgPerTrip: tripCount > 0 ? Math.round(totalVnd / tripCount) : 0,
      byDay,
    }
  }

  async getRatings(driverId: string, star?: string): Promise<DriverRatingsResponse> {
    const starFilter = normalizeStarFilter(star)
    const baseWhere: Prisma.ReviewWhereInput = {
      driverId,
      isHidden: false,
      deliveryRating: { not: null },
    }
    const reviewsWhere: Prisma.ReviewWhereInput = {
      ...baseWhere,
      ...(starFilter ? { deliveryRating: starFilter } : {}),
    }
    const [statsRows, reviews] = await Promise.all([
      this.prisma.review.findMany({
        where: baseWhere,
        select: { deliveryRating: true },
      }),
      this.prisma.review.findMany({
        where: reviewsWhere,
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          deliveryRating: true,
          comment: true,
          createdAt: true,
          order: { select: { id: true, orderCode: true } },
          customer: { select: { fullName: true, avatarUrl: true } },
        },
      }),
    ])

    return {
      reviews: reviews.map(review => ({
        id: review.id,
        customerName: review.customer.fullName,
        customerAvatarUrl: review.customer.avatarUrl,
        rating: review.deliveryRating ?? 0,
        comment: review.comment,
        date: review.createdAt.toISOString(),
        orderId: review.order.id,
        orderCode: review.order.orderCode,
      })),
      stats: ratingStats(statsRows.map(row => row.deliveryRating).filter((rating): rating is number => rating !== null)),
      hasMore: reviews.length === 50,
    }
  }

  async getHeatmap(query: DriverHeatmapQuery): Promise<DriverHeatmapPoint[]> {
    const lat = query.lat
    const lng = query.lng
    const radiusKm = query.radiusKm ?? 5
    if (!isValidLatitude(lat) || !isValidLongitude(lng) || !Number.isFinite(radiusKm) || radiusKm <= 0) {
      throw new BadRequestException('INVALID_HEATMAP_QUERY')
    }

    const radiusMeters = Math.min(radiusKm, 25) * 1000
    const sinceDate = heatmapWindowStart(query.window)
    const rows = await this.prisma.$queryRaw<Array<{
      lat: number
      lng: number
      orderCount: number
      avgPayout: number
    }>>(Prisma.sql`
      SELECT
        ST_Y(r.location::geometry)::float8 AS "lat",
        ST_X(r.location::geometry)::float8 AS "lng",
        COUNT(o.id)::int AS "orderCount",
        COALESCE(AVG(o.delivery_fee)::float8, 0) AS "avgPayout"
      FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.created_at >= ${sinceDate}
        AND o.status NOT IN ('cancelled', 'refunded')
        AND ST_DWithin(
          r.location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      GROUP BY r.id, r.location
      ORDER BY "orderCount" DESC
      LIMIT 80
    `)

    return rows.map(row => ({
      lat: Number(row.lat),
      lng: Number(row.lng),
      orderCount: Number(row.orderCount),
      avgPayout: Math.round(Number(row.avgPayout)),
      demandLevel: demandLevel(Number(row.orderCount)),
    }))
  }
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}

function heatmapWindowStart(window: string | undefined): Date {
  const now = new Date()
  if (window === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const hours = window === '3h' ? 3 : window === '1h' ? 1 : 0.5
  return new Date(now.getTime() - hours * 60 * 60 * 1000)
}

function demandLevel(orderCount: number): 0 | 1 | 2 {
  if (orderCount >= 10) return 2
  if (orderCount >= 4) return 1
  return 0
}

function normalizeEarningsPeriod(period: string | undefined): '7d' | '30d' | '90d' {
  if (period === '30d' || period === 'thirtyDays') return '30d'
  if (period === '90d' || period === 'ninetyDays') return '90d'
  return '7d'
}

function earningsPeriodDays(period: '7d' | '30d' | '90d'): number {
  if (period === '90d') return 90
  if (period === '30d') return 30
  return 7
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeStarFilter(star: string | undefined): number | undefined {
  const value = Number(star)
  if (!Number.isInteger(value) || value < 1 || value > 5) return undefined
  return value
}

function ratingStats(ratings: number[]): DriverRatingStats {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const rating of ratings) {
    if (rating >= 1 && rating <= 5) distribution[rating as 1 | 2 | 3 | 4 | 5] += 1
  }
  const totalReviews = ratings.length
  const average = totalReviews === 0
    ? 0
    : Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews) * 10) / 10
  return { average, totalReviews, distribution }
}
