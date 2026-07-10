import { Injectable, Inject, Logger, forwardRef } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { DriverScoringService } from './driver-scoring.service'
import { CooldownService } from './cooldown.service'
import { SurgePricingService } from './surge-pricing.service'
import { DispatchMetrics } from './dispatch.metrics'
import Redis from 'ioredis'
import { OrdersGateway } from '../orders/orders.gateway'
import { OrdersService } from '../orders/orders.service'
import { DispatchOfferService } from './dispatch-offer.service'

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
    private readonly offers: DispatchOfferService,
    private readonly ordersGateway: OrdersGateway,
    private readonly scoring: DriverScoringService,
    private readonly cooldown: CooldownService,
    private readonly surge: SurgePricingService,
    private readonly metrics: DispatchMetrics,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject(forwardRef(() => OrdersService)) private readonly ordersService: OrdersService,
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
  ): Promise<{ assigned: boolean; pending?: boolean; driverId?: string; offerId?: string }> {
    const lockKey = `lock:dispatch:${orderId}`
    const lockToken = crypto.randomUUID()
    const locked = await this.redis.set(lockKey, lockToken, 'PX', 30000, 'NX')
    if (!locked) return { assigned: false }

    this.metrics.attemptsTotal.inc({ attempt_no: String(attempt) })

    try {
      const candidates = await this.findCandidates(lat, lng, radiusKm)
      const attemptedDriverIds = await this.offers.attemptedDriverIds(orderId)
      const candidate = candidates.find(item => !attemptedDriverIds.has(item.driverId))
      this.metrics.availableDriversPerZone.set(
        { zone: `${Math.floor(lat * 20)}:${Math.floor(lng * 20)}` },
        candidate ? 1 : 0,
      )

      if (!candidate) {
        const surgeMultiplier = this.surge.checkAndUpdate(lat, lng, attempt, false)
        this.logger.debug(`No untried candidates for order ${orderId} attempt ${attempt} (surge: ${surgeMultiplier}x)`)
        this.metrics.noDriverTotal.inc({ reason: 'no_candidates' })
        return { assigned: false }
      }

      this.surge.checkAndUpdate(lat, lng, attempt, true)
      const surgeMultiplier = attempt >= 3 ? this.surge.getMultiplier(lat, lng) : 1.0
      const offer = await this.offers.createOffer({
        orderId,
        candidate,
        restaurantLat: lat,
        restaurantLng: lng,
        attempt,
        surgeMultiplier,
      })
      return {
        assigned: false,
        pending: true,
        driverId: offer.driverId,
        offerId: offer.offerId,
      }
    } finally {
      await this.redis.eval(
        `if redis.call("get",KEYS[1])==ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`,
        1, lockKey, lockToken,
      )
    }
  }

  async autoCancelOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    })
    if (!order) {
      this.logger.warn(`Order ${orderId} not found for auto-cancel`)
      return
    }

    // Only cancel while still waiting for a driver (avoid clobbering in-flight trips)
    const cancellable = new Set([
      'restaurant_accepted',
      'preparing',
      'ready_for_pickup',
    ])
    if (!cancellable.has(order.status)) {
      this.logger.log(
        `Skip auto-cancel for order ${orderId}: status=${order.status} is not dispatch-cancellable`,
      )
      return
    }

    await this.ordersService.transition(
      orderId,
      'cancelled',
      'system',
      'system',
      'no_driver_available',
    )
    this.ordersGateway.broadcastToOrder(orderId, 'order:auto_cancelled', {
      orderId,
      reason: 'no_driver_available',
    })
    this.logger.warn(`Order ${orderId} auto-cancelled: no driver found after max attempts`)
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
