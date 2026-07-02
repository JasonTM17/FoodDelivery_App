import { Inject, Injectable } from '@nestjs/common'
import { OrderStatus } from '@prisma/client'
import Redis from 'ioredis'
import { PrismaService } from '../database/prisma.service'

const DEFAULT_CENTER = { lng: 106.6297, lat: 10.8231 }
const ACTIVE_DRIVER_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.driver_assigned,
  OrderStatus.driver_arriving_restaurant,
  OrderStatus.picked_up,
  OrderStatus.delivering,
]

type AdminDriverMapStatus = 'online' | 'free' | 'delivering' | 'busy'

interface GeoMember {
  driverId: string
  lat: number
  lng: number
}

interface RedisDriverState {
  alive: boolean
  status: string | null
  orderId: string | null
}

export interface AdminDriverLocation {
  id: string
  driverId: string
  name: string
  rating: number
  status: AdminDriverMapStatus
  lat: number
  lng: number
  currentOrder?: string
  vehicleType?: string
  vehiclePlate?: string | null
  lastSeenAt: string
}

@Injectable()
export class AdminTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async getOnlineDrivers(): Promise<AdminDriverLocation[]> {
    const geoMembers = parseGeoSearchMembers(await this.redis.call(
      'GEOSEARCH',
      'drivers:active',
      'FROMLONLAT',
      String(DEFAULT_CENTER.lng),
      String(DEFAULT_CENTER.lat),
      'BYRADIUS',
      '50',
      'km',
      'WITHCOORD',
      'ASC',
    ))
    if (geoMembers.length === 0) return []

    const driverIds = geoMembers.map(member => member.driverId)
    const [redisStates, profiles, activeOrders] = await Promise.all([
      this.getRedisDriverStates(driverIds),
      this.prisma.driverProfile.findMany({
        where: { userId: { in: driverIds }, user: { isActive: true } },
        select: {
          userId: true,
          vehicleType: true,
          vehiclePlate: true,
          isOnline: true,
          rating: true,
          user: { select: { fullName: true } },
        },
      }),
      this.prisma.order.findMany({
        where: {
          driverId: { in: driverIds },
          status: { in: ACTIVE_DRIVER_ORDER_STATUSES },
        },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, orderCode: true, driverId: true },
      }),
    ])

    const profileByDriver = new Map(profiles.map(profile => [profile.userId, profile]))
    const activeOrderByDriver = new Map(
      activeOrders
        .filter(order => order.driverId)
        .map(order => [order.driverId as string, order]),
    )
    const now = new Date().toISOString()

    return geoMembers.flatMap((member): AdminDriverLocation[] => {
      const redisState = redisStates.get(member.driverId)
      if (!redisState?.alive) return []

      const profile = profileByDriver.get(member.driverId)
      if (!profile) return []

      const activeOrder = activeOrderByDriver.get(member.driverId)
      const currentOrder = activeOrder?.orderCode ?? activeOrder?.id ?? redisState.orderId ?? undefined

      return [{
        id: member.driverId,
        driverId: member.driverId,
        name: profile.user.fullName,
        rating: Number(profile.rating),
        status: resolveMapStatus(redisState.status, profile.isOnline, Boolean(currentOrder)),
        lat: member.lat,
        lng: member.lng,
        currentOrder,
        vehicleType: profile.vehicleType,
        vehiclePlate: profile.vehiclePlate,
        lastSeenAt: now,
      }]
    })
  }

  private async getRedisDriverStates(driverIds: string[]): Promise<Map<string, RedisDriverState>> {
    const keys = driverIds.flatMap(driverId => [
      `driver:${driverId}:alive`,
      `driver:${driverId}:status`,
      `driver:${driverId}:current_order`,
    ])
    const values = await this.redis.mget(...keys)
    const states = new Map<string, RedisDriverState>()

    driverIds.forEach((driverId, index) => {
      const offset = index * 3
      states.set(driverId, {
        alive: values[offset] === '1',
        status: values[offset + 1] || null,
        orderId: values[offset + 2] || null,
      })
    })

    return states
  }
}

export function parseGeoSearchMembers(raw: unknown): GeoMember[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((entry): GeoMember[] => {
    if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !Array.isArray(entry[1])) {
      return []
    }

    const [lngRaw, latRaw] = entry[1] as unknown[]
    const lng = Number(lngRaw)
    const lat = Number(latRaw)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return []

    return [{
      driverId: entry[0].replace(/^driver:/, ''),
      lat,
      lng,
    }]
  })
}

function resolveMapStatus(
  redisStatus: string | null,
  isOnline: boolean,
  hasActiveOrder: boolean,
): AdminDriverMapStatus {
  if (hasActiveOrder) return 'delivering'
  if (redisStatus === 'busy') return 'busy'
  if (redisStatus === 'free') return 'free'
  return isOnline ? 'online' : 'online'
}
