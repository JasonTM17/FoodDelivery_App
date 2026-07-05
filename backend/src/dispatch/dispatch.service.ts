import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { DispatchGateway } from './dispatch.gateway'
import { DriverScoringService } from './driver-scoring.service'
import { CooldownService } from './cooldown.service'
import { SurgePricingService } from './surge-pricing.service'
import { DispatchMetrics } from './dispatch.metrics'
import Redis from 'ioredis'

interface DriverCandidate {
  driverId: string
  distKm: number
  rating: number
  acceptanceRate7d?: number
  completionRate7d?: number
  idleMinutes?: number
  totalDeliveries: number
  score: number
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchGateway: DispatchGateway,
    private readonly scoring: DriverScoringService,
    private readonly cooldown: CooldownService,
    private readonly surge: SurgePricingService,
    private readonly metrics: DispatchMetrics,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async findCandidates(lat: number, lng: number, radiusKm: number): Promise<DriverCandidate[]> {
    const raw = await this.redis.call(
      'GEOSEARCH', 'drivers:active',
      'FROMLONLAT', lng.toString(), lat.toString(),
      'BYRADIUS', radiusKm.toString(), 'km',
      'WITHDIST', 'ASC',
    ) as Array<unknown>

    if (!raw?.length) return []

    const eligible: DriverCandidate[] = []

    for (const candidate of parseGeoSearchWithDistance(raw)) {
      const driverId = candidate.member.replace('driver:', '')
      const { distKm } = candidate

      const p = this.redis.pipeline()
      p.get(`driver:${driverId}:status`)
      p.get(`driver:${driverId}:current_order`)
      p.get(`driver:${driverId}:rating`)
      p.get(`driver:${driverId}:alive`)
      p.get(`driver:${driverId}:acceptance_rate_7d`)
      p.get(`driver:${driverId}:completion_rate_7d`)
      p.get(`driver:${driverId}:idle_since`)
      p.get(`driver:${driverId}:total_deliveries`)
      const r = await p.exec()
      if (!r) continue

      const status = r[0]?.[1] as string | null
      const currentOrder = r[1]?.[1] as string | null
      const isAlive = r[3]?.[1] as string | null
      if (status !== 'online' || currentOrder || !isAlive) continue

      if (await this.cooldown.isInCooldown(driverId)) continue

      const rating = parseFiniteNumber(r[2]?.[1])
      const acceptanceRate7d = parseRate(r[4]?.[1])
      const completionRate7d = parseRate(r[5]?.[1])
      const idleSince = r[6]?.[1] as string | null
      const idleSinceMs = idleSince ? Number(idleSince) : Number.NaN
      const idleMinutes = Number.isFinite(idleSinceMs)
        ? Math.max(0, (Date.now() - idleSinceMs) / 60000)
        : undefined
      const totalDeliveries = parseNonNegativeInteger(r[7]?.[1])
      if (rating === undefined || totalDeliveries === undefined) continue

      const score = this.scoring.score({ driverId, distKm, rating, acceptanceRate7d, completionRate7d, idleMinutes, totalDeliveries })
      eligible.push({ driverId, distKm, rating, acceptanceRate7d, completionRate7d, idleMinutes, totalDeliveries, score })
    }

    return eligible.sort((a, b) => b.score - a.score)
  }

  async dispatchOrder(
    orderId: string, lat: number, lng: number, radiusKm: number, attempt: number,
  ): Promise<{ assigned: boolean; driverId?: string }> {
    const lockKey = `lock:dispatch:${orderId}`
    const lockToken = crypto.randomUUID()
    const locked = await this.redis.set(lockKey, lockToken, 'PX', 30000, 'NX')
    if (!locked) return { assigned: false }

    const start = Date.now()
    this.metrics.attemptsTotal.inc({ attempt_no: String(attempt) })

    try {
      const candidates = await this.findCandidates(lat, lng, radiusKm)
      this.metrics.availableDriversPerZone.set(
        { zone: `${Math.floor(lat * 20)}:${Math.floor(lng * 20)}` },
        candidates.length,
      )

      if (!candidates.length) {
        const surgeMultiplier = this.surge.checkAndUpdate(lat, lng, attempt, false)
        this.logger.debug(`No candidates for order ${orderId} attempt ${attempt} (surge: ${surgeMultiplier}x)`)
        this.metrics.noDriverTotal.inc({ reason: 'no_candidates' })
        return { assigned: false }
      }

      this.surge.checkAndUpdate(lat, lng, attempt, true)
      const surgeMultiplier = attempt >= 3 ? this.surge.getMultiplier(lat, lng) : 1.0

      for (const candidate of candidates) {
        const accepted = await this.offerToDriver(orderId, candidate, surgeMultiplier)
        if (accepted) {
          await this.assignDriver(orderId, candidate)
          this.metrics.successTotal.inc()
          this.metrics.timeToAssign.observe((Date.now() - start) / 1000)
          return { assigned: true, driverId: candidate.driverId }
        }
        await this.cooldown.recordTimeout(candidate.driverId)
      }

      this.metrics.noDriverTotal.inc({ reason: 'all_rejected' })
      return { assigned: false }
    } finally {
      await this.redis.eval(
        `if redis.call("get",KEYS[1])==ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`,
        1, lockKey, lockToken,
      )
    }
  }

  async autoCancelOrder(orderId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.order.update({ where: { id: orderId }, data: { status: 'cancelled' } }),
      this.prisma.orderStatusHistory.create({ data: { orderId, status: 'cancelled', changedBy: 'system' } }),
    ])
    this.dispatchGateway.broadcastToOrder(orderId, 'order:auto_cancelled', { orderId, reason: 'no_driver_available' })
    this.logger.warn(`Order ${orderId} auto-cancelled: no driver found after max attempts`)
  }

  private async offerToDriver(
    orderId: string, candidate: DriverCandidate, surgeMultiplier: number,
  ): Promise<boolean> {
    const offerToken = crypto.randomUUID()
    const offerKey = `offer:${orderId}:${candidate.driverId}`
    await this.redis.setex(offerKey, 30, offerToken)

    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: {
        total: true,
        deliveryFee: true,
        deliveryAddress: { select: { addressLine: true } },
        restaurant: { select: { name: true, addressLine: true } },
      },
    })

    this.dispatchGateway.sendNewOrderOffer(candidate.driverId, {
      orderId, offerToken,
      restaurantName: order.restaurant.name,
      restaurantAddress: order.restaurant.addressLine,
      deliveryAddress: order.deliveryAddress.addressLine,
      orderTotal: Number(order.total),
      deliveryFee: Number(order.deliveryFee),
      distanceKm: candidate.distKm,
      timeoutSeconds: 30,
      surgeMultiplier,
    })

    return new Promise((resolve) => {
      const timeout = setTimeout(() => { void this.redis.del(offerKey); resolve(false) }, 30000)
      this.dispatchGateway.registerOfferResponse(`${orderId}:${candidate.driverId}`, (accepted: boolean) => {
        clearTimeout(timeout)
        if (!accepted) void this.redis.del(offerKey)
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

    const coords = await this.prisma.$queryRawUnsafe<Array<{ restLng: number; restLat: number; custLng: number; custLat: number }>>(
      `SELECT ST_X(r.location::geometry)::float8 AS "restLng", ST_Y(r.location::geometry)::float8 AS "restLat",
              ST_X(a.location::geometry)::float8 AS "custLng", ST_Y(a.location::geometry)::float8 AS "custLat"
       FROM restaurants r, addresses a WHERE r.id = $1::uuid AND a.id = $2::uuid`,
      order.restaurantId, order.deliveryAddressId,
    )
    const location = coords[0]
    if (!location) throw new NotFoundException('ORDER_LOCATION_NOT_FOUND')

    await this.prisma.$transaction([
      this.prisma.order.update({ where: { id: orderId }, data: { driverId: candidate.driverId, status: 'driver_assigned' } }),
      this.prisma.orderStatusHistory.create({ data: { orderId, status: 'driver_assigned', changedBy: 'system' } }),
      this.prisma.$executeRawUnsafe(
        `INSERT INTO delivery_tasks (order_id, driver_id, pickup_location, dropoff_location, status, driver_rating, assigned_at)
         VALUES ($1::uuid, $2::uuid, ST_SetSRID(ST_MakePoint($3::float8, $4::float8), 4326), ST_SetSRID(ST_MakePoint($5::float8, $6::float8), 4326), 'assigned', $7::numeric, NOW())`,
        orderId, candidate.driverId,
        location.restLng, location.restLat,
        location.custLng, location.custLat,
        candidate.rating.toString(),
      ),
    ])

    await pipeline.exec()
    this.dispatchGateway.sendAssignedOrder(candidate.driverId, { orderId })
    this.dispatchGateway.broadcastToOrder(orderId, 'driver:assigned', {
      driverId: candidate.driverId,
      etaMinutes: null,
    })
  }
}

function parseGeoSearchWithDistance(raw: Array<unknown>): Array<{ member: string; distKm: number }> {
  const tupleRows = raw.flatMap((entry) => {
    if (!Array.isArray(entry) || entry.length < 2) return []
    const member = normalizeGeoMember(entry[0])
    const distKm = parseFiniteNumber(entry[1])
    return member && distKm !== undefined ? [{ member, distKm }] : []
  })
  if (tupleRows.length > 0) return tupleRows

  const flatRows: Array<{ member: string; distKm: number }> = []
  for (let i = 0; i < raw.length; i += 2) {
    const member = normalizeGeoMember(raw[i])
    const distKm = parseFiniteNumber(raw[i + 1])
    if (member && distKm !== undefined) {
      flatRows.push({ member, distKm })
    }
  }
  return flatRows
}

function normalizeGeoMember(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Buffer.isBuffer(value)) return value.toString('utf8')
  return null
}

function parseFiniteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseRate(value: unknown): number | undefined {
  const parsed = parseFiniteNumber(value)
  return parsed !== undefined && parsed >= 0 && parsed <= 1 ? parsed : undefined
}

function parseNonNegativeInteger(value: unknown): number | undefined {
  const parsed = parseFiniteNumber(value)
  return parsed !== undefined && Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
}
