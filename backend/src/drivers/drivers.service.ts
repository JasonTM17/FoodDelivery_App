import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { decodePolyline } from '../common/utils/route.utils'
import { isWithinVietnamDeliveryBounds } from '../common/utils/delivery-area.utils'
import { haversineDistance } from '../common/utils/geo.utils'
import { routePhaseForStatus, routeResultFromPersistedPhase, type DeliveryRoutePhase } from '../tracking/tracking.service'
import Redis from 'ioredis'

const MAX_LIVE_DRIVER_LOCATION_AGE_MS = 45_000
const MAX_DRIVER_LOCATION_CLOCK_SKEW_FUTURE_MS = 15_000

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

export interface DriverEarningEntry {
  orderId: string
  orderCode: string
  restaurantName: string
  amount: number
  completedAt: string
}

export interface DriverEarningsResponse {
  totalEarnings: number
  totalOrders: number
  averagePerOrder: number
  entries: DriverEarningEntry[]
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

export interface DriverTripRoutePoint {
  lat: number
  lng: number
  timestamp: string
  source: 'telemetry' | 'persisted_geometry'
  timestampEstimated: boolean
}

export interface DriverTripRouteSegment {
  distanceKm: number
  durationSeconds: number
  instruction: string
  startIndex: number
  endIndex: number
}

export interface DriverTripRouteResponse {
  tripId: string
  points: DriverTripRoutePoint[]
  segments: DriverTripRouteSegment[]
  routeSource: 'telemetry' | 'persisted_geometry' | 'none'
  timestampsEstimated: boolean
  totalDistanceKm: number
  totalDurationSeconds: number
  avgSpeedKmh: number
  payout: number
}

const driverOrderInclude = Prisma.validator<Prisma.OrderInclude>()({
  restaurant: {
    select: { name: true, logoUrl: true, addressLine: true, phone: true },
  },
  customer: { select: { fullName: true, phone: true } },
  deliveryAddress: { select: { label: true, addressLine: true } },
  deliveryTask: { select: { routeGeojson: true } },
  orderItems: true,
  statusHistory: { orderBy: { createdAt: 'asc' } },
})

type DriverOrderRecord = Prisma.OrderGetPayload<{ include: typeof driverOrderInclude }>

interface DriverOrderLocationRow {
  restaurantLat: number
  restaurantLng: number
  deliveryLat: number
  deliveryLng: number
}

export interface DriverOrderResponse {
  id: string
  userId: string
  restaurantId: string
  restaurantName: string
  restaurantLogoUrl: string | null
  restaurantPhone: string | null
  customerName: string
  customerPhone: string | null
  items: Array<{
    menuItemId: string
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    selectedOptions: Prisma.JsonValue
  }>
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  status: string
  driverId: string | null
  deliveryAddress: {
    label: string
    address: string
    latitude: number
    longitude: number
  }
  paymentMethod: string
  note: string | null
  createdAt: string
  updatedAt: string
  statusHistory: Array<{ status: string; timestamp: string; note: string | null }>
  restaurantLatitude: number
  restaurantLongitude: number
  estimatedDeliveryTimeMinutes: number | null
  routePhase: DeliveryRoutePhase
  routePolyline: string | null
}

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async goOnline(
    driverId: string,
    lat: number,
    lng: number,
    sampledAt: string,
  ): Promise<{ isOnline: true; lat: number; lng: number }> {
    if (!isWithinVietnamDeliveryBounds(lat, lng)) {
      throw new BadRequestException('LOCATION_OUT_OF_DELIVERY_AREA')
    }
    const sampledAtDate = parseFreshOnlineSampleTimestamp(sampledAt)

    const profile = await this.prisma.driverProfile.findUniqueOrThrow({ where: { userId: driverId } })
    if (!profile.isVerified) throw new BadRequestException('DRIVER_NOT_VERIFIED')
    const recordedAt = sampledAtDate.toISOString()

    await this.redis.geoadd('drivers:active', lng, lat, `driver:${driverId}`)
    await this.redis.set(`driver:${driverId}:status`, 'online')
    await this.redis.setex(`driver:${driverId}:alive`, 35, '1')
    await this.redis.setex(`driver:${driverId}:last_seen_at`, 35, recordedAt)
    await this.redis.set(`driver:${driverId}:rating`, profile.rating.toString())
    await this.redis.set(`driver:${driverId}:total_deliveries`, profile.totalDeliveries.toString())
    await this.redis.set(`driver:${driverId}:idle_since`, Date.now().toString())
    await this.redis.set(`driver:${driverId}:current_order`, '')

    await this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: { isOnline: true, currentLat: lat, currentLng: lng },
    })

    return { isOnline: true, lat, lng }
  }

  async goOffline(driverId: string): Promise<{ isOnline: false }> {
    // ZREM is correct for geo keys — GEOADD stores members in a sorted set internally.
    // Redis does not have a separate GEO-removal command.
    await this.redis.zrem('drivers:active', `driver:${driverId}`)
    await this.redis.del(`driver:${driverId}:status`)
    await this.redis.del(`driver:${driverId}:alive`)
    await this.redis.del(`driver:${driverId}:last_seen_at`)
    await this.redis.del(`driver:${driverId}:idle_since`)
    await this.redis.del(`driver:${driverId}:current_order`)

    await this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: { isOnline: false },
    })

    return { isOnline: false }
  }

  async getActiveOrder(driverId: string): Promise<DriverOrderResponse | null> {
    const order = await this.prisma.order.findFirst({
      where: {
        driverId,
        status: {
          in: [
            'driver_assigned',
            'driver_arriving_restaurant',
            'picked_up',
            'delivering',
          ],
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: driverOrderInclude,
    })
    return order ? this.serializeDriverOrder(order) : null
  }

  async getOrderHistory(
    driverId: string,
    fromDate?: string,
    toDate?: string,
    limit = 20,
  ): Promise<DriverOrderResponse[]> {
    const createdAt = dateRange(fromDate, toDate)
    const orders = await this.prisma.order.findMany({
      where: {
        driverId,
        status: { in: ['delivered', 'completed', 'cancelled', 'refunded'] },
        ...(createdAt ? { createdAt } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 50),
      include: driverOrderInclude,
    })
    return Promise.all(orders.map(order => this.serializeDriverOrder(order)))
  }

  async getEarnings(
    driverId: string,
    period: string,
  ): Promise<DriverEarningsResponse> {
    const normalizedPeriod = normalizeDriverEarningsPeriod(period)
    const startDate = driverEarningsStart(normalizedPeriod)
    const ledgers = await this.prisma.payoutLedger.findMany({
      where: {
        recipientType: 'driver',
        recipientId: driverId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        orderId: true,
        amount: true,
        createdAt: true,
        order: {
          select: {
            orderCode: true,
            restaurant: { select: { name: true } },
            deliveryTask: { select: { deliveredAt: true } },
          },
        },
      },
    })
    const totalEarnings = ledgers.reduce((sum, ledger) => sum + Number(ledger.amount), 0)
    const totalOrders = new Set(ledgers.map(ledger => ledger.orderId)).size

    return {
      totalEarnings,
      totalOrders,
      averagePerOrder: totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0,
      entries: ledgers.map(ledger => ({
        orderId: ledger.orderId,
        orderCode: ledger.order.orderCode,
        restaurantName: ledger.order.restaurant.name,
        amount: Number(ledger.amount),
        completedAt: (ledger.order.deliveryTask?.deliveredAt ?? ledger.createdAt).toISOString(),
      })),
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

  async getTripRoute(driverId: string, tripId: string): Promise<DriverTripRouteResponse> {
    const order = await this.prisma.order.findFirst({
      where: {
        driverId,
        OR: [
          ...(isUuid(tripId) ? [{ id: tripId }] : []),
          { orderCode: tripId },
        ],
      },
      select: {
        id: true,
        orderCode: true,
        createdAt: true,
        updatedAt: true,
        routePolyline: true,
        routeWaypoints: true,
        deliveryTask: {
          select: {
            assignedAt: true,
            deliveredAt: true,
            pickupDistanceKm: true,
            deliveryDistanceKm: true,
            durationInTraffic: true,
          },
        },
        payoutLedgers: {
          where: {
            recipientType: 'driver',
            recipientId: driverId,
          },
          select: { amount: true },
        },
      },
    })
    if (!order) throw new NotFoundException('TRIP_ROUTE_NOT_FOUND')

    const start = order.deliveryTask?.assignedAt ?? order.createdAt
    const end = order.deliveryTask?.deliveredAt ?? order.updatedAt
    const telemetryRows = await this.prisma.$queryRaw<Array<{
      lat: number
      lng: number
      timestamp: Date
    }>>(Prisma.sql`
      SELECT
        ST_Y(location::geometry)::float8 AS "lat",
        ST_X(location::geometry)::float8 AS "lng",
        recorded_at AS "timestamp"
      FROM driver_location_history
      WHERE driver_id = CAST(${driverId} AS uuid)
        AND order_id = CAST(${order.id} AS uuid)
        AND recorded_at >= ${start}
        AND recorded_at <= ${end}
      ORDER BY recorded_at ASC
      LIMIT 1000
    `)

    const points = telemetryRows.length > 0
      ? telemetryRows.map(row => ({
        lat: Number(row.lat),
        lng: Number(row.lng),
        timestamp: row.timestamp.toISOString(),
        source: 'telemetry' as const,
        timestampEstimated: false,
      }))
      : persistedRoutePoints(order.routeWaypoints, order.routePolyline, start, end)
    const routeSource = points[0]?.source ?? 'none'

    const distanceKm = routeDistanceKm(points)
    const storedDistanceKm =
      decimalToNumber(order.deliveryTask?.pickupDistanceKm) +
      decimalToNumber(order.deliveryTask?.deliveryDistanceKm)
    const totalDistanceKm = roundOneDecimal(storedDistanceKm > 0 ? storedDistanceKm : distanceKm)
    const durationFromPoints = routeDurationSeconds(points)
    const totalDurationSeconds = order.deliveryTask?.durationInTraffic ?? durationFromPoints
    const payout = order.payoutLedgers.reduce((sum, ledger) => sum + Number(ledger.amount), 0)

    return {
      tripId: order.id,
      points,
      segments: [],
      routeSource,
      timestampsEstimated: points.some(point => point.timestampEstimated),
      totalDistanceKm,
      totalDurationSeconds,
      avgSpeedKmh: routeSource === 'telemetry' && totalDurationSeconds > 0
        ? roundOneDecimal(totalDistanceKm / (totalDurationSeconds / 3600))
        : 0,
      payout,
    }
  }

  async getHeatmap(driverId: string, query: DriverHeatmapQuery): Promise<DriverHeatmapPoint[]> {
    const lat = query.lat
    const lng = query.lng
    const radiusKm = query.radiusKm ?? 5
    if (!isValidLatitude(lat) || !isValidLongitude(lng) || !Number.isFinite(radiusKm) || radiusKm <= 0) {
      throw new BadRequestException('INVALID_HEATMAP_QUERY')
    }
    await this.assertVerifiedDriver(driverId)

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

  private async assertVerifiedDriver(driverId: string): Promise<void> {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId: driverId },
      select: { isVerified: true },
    })
    if (!profile?.isVerified) throw new BadRequestException('DRIVER_NOT_VERIFIED')
  }

  private async serializeDriverOrder(order: DriverOrderRecord): Promise<DriverOrderResponse> {
    const routePhase = routePhaseForStatus(order.status)
    const phaseRoute = routeResultFromPersistedPhase(order.deliveryTask?.routeGeojson, routePhase)
    const locations = await this.prisma.$queryRaw<DriverOrderLocationRow[]>(Prisma.sql`
      SELECT
        ST_Y(r.location::geometry)::float8 AS "restaurantLat",
        ST_X(r.location::geometry)::float8 AS "restaurantLng",
        ST_Y(a.location::geometry)::float8 AS "deliveryLat",
        ST_X(a.location::geometry)::float8 AS "deliveryLng"
      FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      JOIN addresses a ON a.id = o.delivery_address_id
      WHERE o.id = CAST(${order.id} AS uuid)
      LIMIT 1
    `)
    const location = locations[0]
    if (!location) throw new NotFoundException('ORDER_LOCATION_NOT_FOUND')

    return {
      id: order.id,
      userId: order.customerId,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurant.name,
      restaurantLogoUrl: order.restaurant.logoUrl,
      restaurantPhone: order.restaurant.phone,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      items: order.orderItems.map(item => ({
        menuItemId: item.menuItemId,
        name: item.nameSnapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.unitPrice) * item.quantity,
        selectedOptions: item.selectedOptions,
      })),
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      discount: Number(order.promotionDiscount),
      total: Number(order.total),
      status: order.status,
      driverId: order.driverId,
      deliveryAddress: {
        label: order.deliveryAddress.label,
        address: order.deliveryAddress.addressLine,
        latitude: Number(location.deliveryLat),
        longitude: Number(location.deliveryLng),
      },
      paymentMethod: order.paymentMethod,
      note: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      statusHistory: order.statusHistory.map(history => ({
        status: history.status,
        timestamp: history.createdAt.toISOString(),
        note: history.note,
      })),
      restaurantLatitude: Number(location.restaurantLat),
      restaurantLongitude: Number(location.restaurantLng),
      estimatedDeliveryTimeMinutes: order.estimatedDeliveryTimeMinutes,
      routePhase,
      routePolyline: phaseRoute?.polyline ?? null,
    }
  }
}

function dateRange(
  fromDate?: string,
  toDate?: string,
): Prisma.DateTimeFilter | undefined {
  const from = parseDate(fromDate)
  const to = parseDate(toDate)
  if (!from && !to) return undefined
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  }
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
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

function parseFreshOnlineSampleTimestamp(sampledAt: string): Date {
  const parsed = new Date(sampledAt)
  if (!Number.isFinite(parsed.getTime())) {
    throw new BadRequestException('INVALID_DRIVER_LOCATION_TIMESTAMP')
  }
  const ageMs = Date.now() - parsed.getTime()
  if (ageMs > MAX_LIVE_DRIVER_LOCATION_AGE_MS) {
    throw new BadRequestException('STALE_DRIVER_LOCATION_TIMESTAMP')
  }
  if (ageMs < -MAX_DRIVER_LOCATION_CLOCK_SKEW_FUTURE_MS) {
    throw new BadRequestException('FUTURE_DRIVER_LOCATION_TIMESTAMP')
  }
  return parsed
}

function normalizeEarningsPeriod(period: string | undefined): '7d' | '30d' | '90d' {
  if (period === '30d' || period === 'thirtyDays') return '30d'
  if (period === '90d' || period === 'ninetyDays') return '90d'
  return '7d'
}

function normalizeDriverEarningsPeriod(period: string): 'today' | 'week' | 'month' {
  if (period === 'today' || period === 'week' || period === 'month') return period
  throw new BadRequestException('INVALID_EARNINGS_PERIOD')
}

function driverEarningsStart(period: 'today' | 'week' | 'month'): Date {
  const now = new Date()
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
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

function persistedRoutePoints(
  routeWaypoints: Prisma.JsonValue | null,
  routePolyline: string | null,
  start: Date,
  end: Date,
): DriverTripRoutePoint[] {
  const waypoints = parseWaypoints(routeWaypoints)
  const geometryPoints = waypoints.length > 0
    ? waypoints
    : routePolyline
      ? safeDecodePolyline(routePolyline)
      : []
  return geometryPoints.map((point, index) => ({
    lat: point.lat,
    lng: point.lng,
    timestamp: interpolateTimestamp(start, end, index, geometryPoints.length),
    source: 'persisted_geometry',
    timestampEstimated: true,
  }))
}

function parseWaypoints(value: Prisma.JsonValue | null): Array<{ lat: number; lng: number }> {
  if (!Array.isArray(value)) return []
  return value
    .map(point => {
      if (!point || typeof point !== 'object' || Array.isArray(point)) return null
      const lat = Number((point as Record<string, unknown>).lat)
      const lng = Number((point as Record<string, unknown>).lng)
      return isValidLatitude(lat) && isValidLongitude(lng) ? { lat, lng } : null
    })
    .filter((point): point is { lat: number; lng: number } => point !== null)
}

function safeDecodePolyline(polyline: string): Array<{ lat: number; lng: number }> {
  try {
    return decodePolyline(polyline).filter(point => isValidLatitude(point.lat) && isValidLongitude(point.lng))
  } catch {
    return []
  }
}

function interpolateTimestamp(start: Date, end: Date, index: number, total: number): string {
  if (total <= 1) return start.toISOString()
  const spanMs = Math.max(0, end.getTime() - start.getTime())
  return new Date(start.getTime() + spanMs * (index / (total - 1))).toISOString()
}

function routeDistanceKm(points: DriverTripRoutePoint[]): number {
  let distance = 0
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    distance += haversineDistance(previous.lat, previous.lng, current.lat, current.lng)
  }
  return distance
}

function routeDurationSeconds(points: DriverTripRoutePoint[]): number {
  if (points.length < 2) return 0
  const first = Date.parse(points[0].timestamp)
  const last = Date.parse(points[points.length - 1].timestamp)
  if (!Number.isFinite(first) || !Number.isFinite(last) || last <= first) return 0
  return Math.round((last - first) / 1000)
}

function decimalToNumber(value: unknown): number {
  if (value == null) return 0
  return Number(value)
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
