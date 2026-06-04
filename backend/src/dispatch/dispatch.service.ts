import { Injectable, Inject } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../database/prisma.service'
import { DispatchGateway } from './dispatch.gateway'
import Redis from 'ioredis'

interface DriverCandidate {
  driverId: string
  distKm: number
  rating: number
}

const MAX_RADIUS_KM = 10

@Injectable()
export class DispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchGateway: DispatchGateway,
    @InjectQueue('dispatch') private readonly dispatchQueue: Queue,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async findCandidates(restaurantLat: number, restaurantLng: number, radiusKm: number = 5): Promise<DriverCandidate[]> {
    const result = await this.redis.call(
      'GEOSEARCH', 'drivers:active',
      'FROMLONLAT', restaurantLng.toString(), restaurantLat.toString(),
      'BYRADIUS', radiusKm.toString(), 'km',
      'WITHDIST', 'ASC',
    ) as Array<[string, string]>

    if (!result || result.length === 0) return []

    const eligible: DriverCandidate[] = []

    // result format: alternating [member, dist, member, dist, ...]
    for (let i = 0; i < result.length; i += 2) {
      const member = result[i] as unknown as string
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      const distKm = parseFloat(result[i + 1] as unknown as string)
      const driverId = member.replace('driver:', '')

      const pipeline = this.redis.pipeline()
      pipeline.get(`driver:${driverId}:status`)
      pipeline.get(`driver:${driverId}:current_order`)
      pipeline.get(`driver:${driverId}:rating`)
      pipeline.get(`driver:${driverId}:alive`)
      const pipeResults = await pipeline.exec()
      if (!pipeResults) continue

      const status = pipeResults[0]?.[1] as string | null
      const currentOrder = pipeResults[1]?.[1] as string | null
      const ratingStr = pipeResults[2]?.[1] as string | null
      const isAlive = pipeResults[3]?.[1] as string | null

      if (status === 'online' && !currentOrder && isAlive) {
        eligible.push({ driverId, distKm, rating: parseFloat(ratingStr ?? '4.0') })
      }
    }

    eligible.sort((a, b) => a.distKm - b.distKm || b.rating - a.rating)
    return eligible
  }

  async dispatchOrder(orderId: string, restaurantLat: number, restaurantLng: number, radiusKm: number = 5): Promise<{ assigned: boolean; driverId?: string }> {
    const lockKey = `lock:dispatch:${orderId}`
    const lockToken = crypto.randomUUID()
    const locked = await this.redis.set(lockKey, lockToken, 'PX', 30000, 'NX')
    if (!locked) return { assigned: false }

    try {
      const candidates = await this.findCandidates(restaurantLat, restaurantLng, radiusKm)

      if (candidates.length === 0) {
        if (radiusKm < MAX_RADIUS_KM) {
          await this.dispatchQueue.add('dispatch.driver',
            { orderId, restaurantLat, restaurantLng, radius: radiusKm + 2 },
            { delay: 10000 },
          )
        }
        return { assigned: false }
      }

      for (const candidate of candidates) {
        const accepted = await this.offerToDriver(orderId, candidate)
        if (accepted) {
          await this.assignDriver(orderId, candidate)
          return { assigned: true, driverId: candidate.driverId }
        }
      }

      await this.dispatchQueue.add('dispatch.driver',
        { orderId, restaurantLat, restaurantLng, radius: radiusKm + 2 },
        { delay: 10000 },
      )
      return { assigned: false }
    } finally {
      const luaScript = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`
      await this.redis.eval(luaScript, 1, lockKey, lockToken)
    }
  }

  private async offerToDriver(orderId: string, candidate: DriverCandidate): Promise<boolean> {
    const offerToken = crypto.randomUUID()
    const offerKey = `offer:${orderId}:${candidate.driverId}`
    await this.redis.setex(offerKey, 30, offerToken)

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { restaurant: { select: { name: true, addressLine: true } } },
    })

    this.dispatchGateway.sendNewOrderOffer(candidate.driverId, {
      orderId,
      offerToken,
      restaurantName: order?.restaurant.name ?? '',
      restaurantAddress: order?.restaurant.addressLine ?? '',
      distanceKm: candidate.distKm,
      timeoutSeconds: 30,
    })

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        void this.redis.del(offerKey)
        resolve(false)
      }, 30000)

      this.dispatchGateway.registerOfferResponse(`${orderId}:${candidate.driverId}`, (accepted: boolean) => {
        clearTimeout(timeout)
        if (!accepted) { void this.redis.del(offerKey) }
        resolve(accepted)
      })
    })
  }

  private async assignDriver(orderId: string, candidate: DriverCandidate): Promise<void> {
    const pipeline = this.redis.pipeline()
    pipeline.set(`driver:${candidate.driverId}:status`, 'busy')
    pipeline.set(`driver:${candidate.driverId}:current_order`, orderId)

    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { deliveryAddressId: true, restaurantId: true },
    })

    // Get real coordinates for both restaurant and delivery address
    const coords = await this.prisma.$queryRawUnsafe<Array<{ restLng: number; restLat: number; custLng: number; custLat: number }>>(
      `SELECT
        ST_X(r.location::geometry)::float8 AS "restLng", ST_Y(r.location::geometry)::float8 AS "restLat",
        ST_X(a.location::geometry)::float8 AS "custLng", ST_Y(a.location::geometry)::float8 AS "custLat"
       FROM restaurants r, addresses a
       WHERE r.id = $1::uuid AND a.id = $2::uuid`,
      order.restaurantId, order.deliveryAddressId,
    )

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { driverId: candidate.driverId, status: 'driver_assigned' },
      }),
      this.prisma.orderStatusHistory.create({
        data: { orderId, status: 'driver_assigned', changedBy: 'system' },
      }),
      this.prisma.$executeRawUnsafe(
        `INSERT INTO delivery_tasks (order_id, driver_id, pickup_location, dropoff_location, status, driver_rating, assigned_at)
         VALUES ($1::uuid, $2::uuid, ST_SetSRID(ST_MakePoint($3::float8, $4::float8), 4326), ST_SetSRID(ST_MakePoint($5::float8, $6::float8), 4326), 'assigned', $7::numeric, NOW())`,
        orderId, candidate.driverId,
        coords[0]?.restLng ?? 0, coords[0]?.restLat ?? 0,
        coords[0]?.custLng ?? 0, coords[0]?.custLat ?? 0,
        candidate.rating.toString(),
      ),
    ])

    await pipeline.exec()

    this.dispatchGateway.broadcastToOrder(orderId, 'driver:assigned', {
      driverId: candidate.driverId,
      etaMinutes: Math.round(candidate.distKm / 20 * 60),
    })
  }
}
