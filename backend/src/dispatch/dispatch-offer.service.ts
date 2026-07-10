import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { DispatchOffer, Prisma } from '@prisma/client'
import { Queue } from 'bullmq'
import { createHash, randomUUID } from 'node:crypto'
import Redis from 'ioredis'
import { PrismaService } from '../database/prisma.service'
import { OrdersGateway } from '../orders/orders.gateway'
import { type DeliveryRoutePhase, routeCacheKey } from '../tracking/tracking.service'
import { CooldownService } from './cooldown.service'
import { DispatchNotifierService } from './dispatch-notifier.service'
import { DispatchMetrics } from './dispatch.metrics'

const OFFER_TTL_MS = 30_000
const ACCEPTED_RECOVERY_GRACE_MS = 15_000

export interface DispatchCandidateSnapshot {
  driverId: string
  distKm: number
  rating: number
  totalDeliveries: number
}

export interface CreateDispatchOfferInput {
  orderId: string
  candidate: DispatchCandidateSnapshot
  restaurantLat: number
  restaurantLng: number
  attempt: number
  surgeMultiplier: number
}

export type DispatchOfferDecision = 'accept' | 'reject'

@Injectable()
export class DispatchOfferService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @InjectQueue('dispatch') private readonly dispatchQueue: Queue,
    private readonly cooldown: CooldownService,
    private readonly notifier: DispatchNotifierService,
    private readonly ordersGateway: OrdersGateway,
    private readonly metrics: DispatchMetrics,
  ) {}

  async attemptedDriverIds(orderId: string): Promise<Set<string>> {
    const rows = await this.prisma.dispatchOffer.findMany({
      where: { orderId },
      select: { driverId: true },
    })
    return new Set(rows.map(row => row.driverId))
  }

  async createOffer(input: CreateDispatchOfferInput): Promise<{ offerId: string; driverId: string }> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + OFFER_TTL_MS)
    const offerToken = randomUUID()
    const tokenHash = hashOfferToken(offerToken)
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: input.orderId },
      select: {
        total: true,
        deliveryFee: true,
        deliveryAddress: { select: { addressLine: true } },
        restaurant: { select: { name: true, addressLine: true } },
      },
    })

    const offer = await this.prisma.$transaction(async tx => {
      await tx.dispatchOffer.updateMany({
        where: {
          orderId: input.orderId,
          status: 'pending',
          expiresAt: { lte: now },
        },
        data: { status: 'expired', respondedAt: now },
      })

      return tx.dispatchOffer.create({
        data: {
          orderId: input.orderId,
          driverId: input.candidate.driverId,
          tokenHash,
          status: 'pending',
          attempt: input.attempt,
          restaurantLat: input.restaurantLat,
          restaurantLng: input.restaurantLng,
          distanceKm: input.candidate.distKm,
          driverRating: input.candidate.rating,
          totalDeliveries: input.candidate.totalDeliveries,
          surgeMultiplier: input.surgeMultiplier,
          expiresAt,
        },
      })
    })

    this.notifier.sendNewOrderOffer(input.candidate.driverId, {
      orderId: input.orderId,
      offerToken,
      restaurantName: order.restaurant.name,
      restaurantAddress: order.restaurant.addressLine,
      deliveryAddress: order.deliveryAddress.addressLine,
      orderTotal: Number(order.total),
      deliveryFee: Number(order.deliveryFee),
      distanceKm: input.candidate.distKm,
      timeoutSeconds: OFFER_TTL_MS / 1000,
      surgeMultiplier: input.surgeMultiplier,
    })

    await this.dispatchQueue.add(
      'dispatch.offer-timeout',
      { offerId: offer.id },
      {
        delay: OFFER_TTL_MS,
        jobId: `dispatch-offer-timeout:${offer.id}`,
        removeOnComplete: true,
      },
    )

    return { offerId: offer.id, driverId: offer.driverId }
  }

  async respondToOffer(
    orderId: string,
    driverId: string,
    offerToken: string,
    decision: DispatchOfferDecision,
  ): Promise<{ orderId: string; decision: DispatchOfferDecision; status: 'assigned' | 'rejected' }> {
    const now = new Date()
    const tokenHash = hashOfferToken(offerToken)
    const offer = await this.prisma.dispatchOffer.findFirst({
      where: {
        orderId,
        driverId,
        tokenHash,
        status: 'pending',
        expiresAt: { gt: now },
      },
    })
    if (!offer) {
      throw new ConflictException('DISPATCH_OFFER_INVALID_OR_EXPIRED')
    }

    const claimed = await this.prisma.dispatchOffer.updateMany({
      where: {
        id: offer.id,
        status: 'pending',
        tokenHash,
        expiresAt: { gt: now },
      },
      data: {
        status: decision === 'accept' ? 'accepted' : 'rejected',
        respondedAt: now,
      },
    })
    if (claimed.count !== 1) {
      throw new ConflictException('DISPATCH_OFFER_ALREADY_RESOLVED')
    }

    if (decision === 'reject') {
      await this.cooldown.recordTimeout(driverId)
      await this.scheduleRetry(offer)
      return { orderId, decision, status: 'rejected' }
    }

    try {
      await this.assignDriver(offer)
      return { orderId, decision, status: 'assigned' }
    } catch (error) {
      await this.prisma.dispatchOffer.updateMany({
        where: { id: offer.id, status: 'accepted' },
        data: { status: 'failed' },
      })
      if (!(error instanceof ConflictException)) {
        await this.scheduleRetry(offer)
      }
      throw error
    }
  }

  async expireOffer(offerId: string): Promise<{ expired: boolean }> {
    const offer = await this.prisma.dispatchOffer.findUnique({ where: { id: offerId } })
    if (!offer) {
      return { expired: false }
    }

    if (offer.status === 'accepted') {
      return this.recoverAcceptedOffer(offer)
    }
    if (offer.status !== 'pending' || offer.expiresAt > new Date()) {
      return { expired: false }
    }

    const expired = await this.prisma.dispatchOffer.updateMany({
      where: { id: offer.id, status: 'pending', expiresAt: { lte: new Date() } },
      data: { status: 'expired', respondedAt: new Date() },
    })
    if (expired.count !== 1) return { expired: false }

    await this.cooldown.recordTimeout(offer.driverId)
    await this.scheduleRetry(offer)
    return { expired: true }
  }

  private async recoverAcceptedOffer(offer: DispatchOffer): Promise<{ expired: boolean }> {
    const ageMs = Date.now() - offer.updatedAt.getTime()
    if (ageMs < ACCEPTED_RECOVERY_GRACE_MS) {
      await this.dispatchQueue.add(
        'dispatch.offer-timeout',
        { offerId: offer.id },
        {
          delay: ACCEPTED_RECOVERY_GRACE_MS - ageMs,
          jobId: `dispatch-offer-recovery:${offer.id}:${offer.updatedAt.getTime()}`,
          removeOnComplete: true,
        },
      )
      return { expired: false }
    }

    const order = await this.prisma.order.findUnique({
      where: { id: offer.orderId },
      select: { driverId: true },
    })
    if (order?.driverId === offer.driverId) {
      await this.prisma.dispatchOffer.updateMany({
        where: { id: offer.id, status: 'accepted' },
        data: { status: 'assigned' },
      })
      return { expired: false }
    }

    const failed = await this.prisma.dispatchOffer.updateMany({
      where: { id: offer.id, status: 'accepted' },
      data: { status: 'failed' },
    })
    if (failed.count !== 1) return { expired: false }

    await this.releaseRedisAssignment(offer.driverId, offer.orderId)
    await this.scheduleRetry(offer)
    return { expired: true }
  }

  private async assignDriver(offer: DispatchOffer): Promise<void> {
    const claimed = await this.claimDriverAssignment(offer.driverId, offer.orderId)
    if (!claimed) throw new ConflictException('DRIVER_NO_LONGER_AVAILABLE')

    try {
      await this.invalidateRouteCaches(offer.orderId)
      const assignment = await this.prisma.$transaction(async tx => {
        const coords = await tx.$queryRaw<Array<{
          restLng: number
          restLat: number
          custLng: number
          custLat: number
        }>>(Prisma.sql`
          SELECT ST_X(r.location::geometry)::float8 AS "restLng",
                 ST_Y(r.location::geometry)::float8 AS "restLat",
                 ST_X(a.location::geometry)::float8 AS "custLng",
                 ST_Y(a.location::geometry)::float8 AS "custLat"
            FROM orders o
            JOIN restaurants r ON r.id = o.restaurant_id
            JOIN addresses a ON a.id = o.delivery_address_id
           WHERE o.id = CAST(${offer.orderId} AS uuid)
           LIMIT 1
        `)
        const location = coords[0]
        if (!location) throw new NotFoundException('ORDER_LOCATION_NOT_FOUND')

        const updated = await tx.order.updateMany({
          where: {
            id: offer.orderId,
            driverId: null,
            status: { in: ['restaurant_accepted', 'preparing', 'ready_for_pickup'] },
          },
          data: {
            driverId: offer.driverId,
            status: 'driver_assigned',
            estimatedDeliveryTimeMinutes: null,
            routePolyline: null,
            routeWaypoints: Prisma.DbNull,
          },
        })
        if (updated.count !== 1) {
          const current = await tx.order.findUnique({
            where: { id: offer.orderId },
            select: { driverId: true },
          })
          if (current?.driverId === offer.driverId) {
            await tx.dispatchOffer.update({
              where: { id: offer.id },
              data: { status: 'assigned' },
            })
            return { alreadyAssigned: true }
          }
          throw new ConflictException('ORDER_NO_LONGER_DISPATCHABLE')
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId: offer.orderId,
            status: 'driver_assigned',
            changedBy: 'system',
          },
        })
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO delivery_tasks (
            id, order_id, driver_id, "pickupLocation", "dropoffLocation",
            status, driver_rating, assigned_at
          )
          VALUES (
            CAST(${randomUUID()} AS uuid),
            CAST(${offer.orderId} AS uuid),
            CAST(${offer.driverId} AS uuid),
            ST_SetSRID(
              ST_MakePoint(CAST(${location.restLng} AS double precision), CAST(${location.restLat} AS double precision)),
              4326
            ),
            ST_SetSRID(
              ST_MakePoint(CAST(${location.custLng} AS double precision), CAST(${location.custLat} AS double precision)),
              4326
            ),
            'assigned',
            CAST(${offer.driverRating.toString()} AS numeric),
            NOW()
          )
        `)
        await tx.dispatchOffer.update({
          where: { id: offer.id },
          data: { status: 'assigned' },
        })
        return { alreadyAssigned: false }
      })

      if (!assignment.alreadyAssigned) {
        this.metrics.successTotal.inc()
        this.metrics.timeToAssign.observe((Date.now() - offer.createdAt.getTime()) / 1000)
        this.notifier.sendAssignedOrder(offer.driverId, { orderId: offer.orderId })
        this.ordersGateway.broadcastToOrder(offer.orderId, 'driver:assigned', {
          driverId: offer.driverId,
          etaMinutes: null,
        })
      }
    } catch (error) {
      await this.releaseRedisAssignment(offer.driverId, offer.orderId)
      throw error
    }
  }

  private async claimDriverAssignment(driverId: string, orderId: string): Promise<boolean> {
    const result = await this.redis.eval(
      `local current = redis.call("get", KEYS[2]); if current == ARGV[1] then return 1 end; if redis.call("get", KEYS[1]) ~= "online" or current then return 0 end; redis.call("set", KEYS[1], "busy"); redis.call("set", KEYS[2], ARGV[1]); redis.call("del", KEYS[3]); return 1`,
      3,
      `driver:${driverId}:status`,
      `driver:${driverId}:current_order`,
      `driver:${driverId}:idle_since`,
      orderId,
    )
    return Number(result) === 1
  }

  private invalidateRouteCaches(orderId: string): Promise<number> {
    return this.redis.del(
      routeRedisKey(orderId, 'pickup'),
      routeRedisKey(orderId, 'dropoff'),
    )
  }

  private async releaseRedisAssignment(driverId: string, orderId: string): Promise<void> {
    await this.redis.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then redis.call("del", KEYS[1]); redis.call("set", KEYS[2], "online"); redis.call("set", KEYS[3], ARGV[2]); return 1 else return 0 end`,
      3,
      `driver:${driverId}:current_order`,
      `driver:${driverId}:status`,
      `driver:${driverId}:idle_since`,
      orderId,
      Date.now().toString(),
    )
  }

  private scheduleRetry(offer: DispatchOffer): Promise<unknown> {
    return this.dispatchQueue.add(
      'dispatch.driver',
      {
        orderId: offer.orderId,
        restaurantLat: offer.restaurantLat,
        restaurantLng: offer.restaurantLng,
        attempt: offer.attempt,
      },
      {
        jobId: `dispatch:${offer.orderId}:${offer.attempt}:after:${offer.id}`,
        removeOnComplete: true,
      },
    )
  }
}

function hashOfferToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function routeRedisKey(orderId: string, phase: DeliveryRoutePhase): string {
  return `route:${routeCacheKey(orderId, phase)}`
}
