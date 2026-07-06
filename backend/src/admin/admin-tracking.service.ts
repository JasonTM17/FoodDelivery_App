import { Inject, Injectable } from '@nestjs/common'
import { OrderStatus } from '@prisma/client'
import Redis from 'ioredis'
import { PrismaService } from '../database/prisma.service'

const VIETNAM_CENTER = { lng: 108.0, lat: 14.0 }
const VIETNAM_RADIUS_KM = 1_400
const VIETNAM_BOUNDS = { north: 23.5, south: 3.8, west: 102.0, east: 117.5 }
const ACTIVE_DRIVER_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.driver_assigned,
  OrderStatus.driver_arriving_restaurant,
  OrderStatus.picked_up,
  OrderStatus.delivering,
]

type AdminDriverMapStatus = 'online' | 'offline' | 'free' | 'delivering' | 'busy'

interface GeoMember {
  driverId: string
  lat: number
  lng: number
}

interface RedisDriverState {
  alive: boolean
  status: string | null
  orderId: string | null
  lastSeenAt: string | null
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
      String(VIETNAM_CENTER.lng),
      String(VIETNAM_CENTER.lat),
      'BYRADIUS',
      String(VIETNAM_RADIUS_KM),
      'km',
      'WITHCOORD',
      'ASC',
    )).filter(isWithinVietnamBounds)
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
    return geoMembers.flatMap((member): AdminDriverLocation[] => {
      const redisState = redisStates.get(member.driverId)
      if (!redisState?.alive || !redisState.lastSeenAt) return []

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
        lastSeenAt: redisState.lastSeenAt,
      }]
    })
  }

  private async getRedisDriverStates(driverIds: string[]): Promise<Map<string, RedisDriverState>> {
    const keys = driverIds.flatMap(driverId => [
      `driver:${driverId}:alive`,
      `driver:${driverId}:status`,
      `driver:${driverId}:current_order`,
      `driver:${driverId}:last_seen_at`,
    ])
    const values = await this.redis.mget(...keys)
    const states = new Map<string, RedisDriverState>()

    driverIds.forEach((driverId, index) => {
      const offset = index * 4
      states.set(driverId, {
        alive: values[offset] === '1',
        status: values[offset + 1] || null,
        orderId: values[offset + 2] || null,
        lastSeenAt: values[offset + 3] || null,
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
  if (!isOnline) return 'offline'
  if (hasActiveOrder) return 'delivering'
  if (redisStatus === 'busy') return 'busy'
  if (redisStatus === 'free') return 'free'
  return 'online'
}

function isWithinVietnamBounds(member: GeoMember): boolean {
  return member.lat >= VIETNAM_BOUNDS.south
    && member.lat <= VIETNAM_BOUNDS.north
    && member.lng >= VIETNAM_BOUNDS.west
    && member.lng <= VIETNAM_BOUNDS.east
}
