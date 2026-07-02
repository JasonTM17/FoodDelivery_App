import { BadRequestException, Injectable } from '@nestjs/common'
import { OrderStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { PromotionTargetingPreviewQueryDto } from './restaurant-promotion.dto'
import { RestaurantAccessService } from './restaurant-access.service'

interface CustomerOrderAggregate {
  customerId: string
  _count: { _all: number }
  _min: { createdAt: Date | null }
  _max: { createdAt: Date | null }
}

const TARGETABLE_STATUSES: OrderStatus[] = [OrderStatus.delivered, OrderStatus.completed]
const DEFAULT_AUDIENCE_WINDOW_DAYS = 30

@Injectable()
export class RestaurantPromotionTargetingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: RestaurantAccessService,
  ) {}

  async preview(userId: string, query: PromotionTargetingPreviewQueryDto) {
    this.assertSupported(query)
    const customers = await this.loadCustomers(userId)

    return buildTargetingPreview(customers, query)
  }

  async resolveCustomerIds(userId: string, query: PromotionTargetingPreviewQueryDto) {
    this.assertSupported(query)
    const customers = await this.loadCustomers(userId)
    return selectTargetCustomers(customers, query).map(customer => customer.customerId)
  }

  private async loadCustomers(userId: string) {
    const restaurantId = await this.access.getRestaurantId(userId)

    return this.prisma.order.groupBy({
      by: ['customerId'],
      where: { restaurantId, status: { in: TARGETABLE_STATUSES } },
      _count: { _all: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
    })
  }

  private assertSupported(query: PromotionTargetingPreviewQueryDto) {
    if (query.audience === 'segment') {
      throw new BadRequestException('PROMOTION_SEGMENT_UNAVAILABLE')
    }
  }
}

export function buildTargetingPreview(
  customers: CustomerOrderAggregate[],
  query: PromotionTargetingPreviewQueryDto,
  now = new Date(),
) {
  const windowDays = query.lastOrderWithinDays ?? DEFAULT_AUDIENCE_WINDOW_DAYS
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)
  const newCustomers = customers.filter(customer => isOnOrAfter(customer._min.createdAt, cutoff))
  const lapsedCustomers = customers.filter(customer => isBefore(customer._max.createdAt, cutoff))
  const returningCustomers = customers.filter(customer =>
    isBefore(customer._min.createdAt, cutoff) && isOnOrAfter(customer._max.createdAt, cutoff))

  const estimatedReach = selectTargetCustomers(customers, query, now).length

  return {
    audience: query.audience,
    estimatedReach,
    breakdown: [
      toBreakdownRow('new', newCustomers.length, customers.length),
      toBreakdownRow('returning', returningCustomers.length, customers.length),
      toBreakdownRow('lapsed', lapsedCustomers.length, customers.length),
    ],
    updatedAt: now.toISOString(),
  }
}

function selectTargetCustomers(
  customers: CustomerOrderAggregate[],
  query: PromotionTargetingPreviewQueryDto,
  now = new Date(),
) {
  const windowDays = query.lastOrderWithinDays ?? DEFAULT_AUDIENCE_WINDOW_DAYS
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

  switch (query.audience) {
    case 'new':
      return customers.filter(customer => isOnOrAfter(customer._min.createdAt, cutoff))
    case 'vip':
      return [...customers]
        .sort((left, right) => right._count._all - left._count._all)
        .slice(0, customers.length === 0 ? 0 : Math.max(1, Math.ceil(customers.length * 0.1)))
    case 'lapsed':
      return customers.filter(customer => isBefore(customer._max.createdAt, cutoff))
    case 'order_history':
      return customers.filter(customer => customer._count._all >= (query.minOrderCount ?? 1))
    default:
      return customers
  }
}

function isBefore(value: Date | null, cutoff: Date): boolean {
  return value !== null && value.getTime() < cutoff.getTime()
}

function isOnOrAfter(value: Date | null, cutoff: Date): boolean {
  return value !== null && value.getTime() >= cutoff.getTime()
}

function toBreakdownRow(key: string, count: number, total: number) {
  return {
    key,
    count,
    pct: total > 0 ? Math.round((count / total) * 100) : 0,
  }
}
