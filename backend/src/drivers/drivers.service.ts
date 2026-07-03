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
