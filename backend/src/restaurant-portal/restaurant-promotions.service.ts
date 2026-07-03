import { ConflictException, Injectable } from '@nestjs/common'
import { Prisma, PromotionStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { RestaurantAccessService } from './restaurant-access.service'
import {
  BulkPromotionDto,
  CreateRestaurantPromotionDto,
  UpdateRestaurantPromotionDto,
} from './restaurant-promotion.dto'
import { RestaurantPromotionTargetingService } from './restaurant-promotion-targeting.service'
import {
  buildPromotionScope,
  mapPromotionType,
  promotionScopesIntersect,
  toPromotionTargetingQuery,
  unmapPromotionType,
} from './restaurant-promotion.utils'
import { settlePromotionNotificationBatches } from './restaurant-promotion-notification-batches'
import {
  buildPromotionAnalytics,
  buildPromotionAnalyticsSummary,
  promotionUsageAnalyticsSelect,
} from './restaurant-promotion-analytics'

@Injectable()
export class RestaurantPromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: RestaurantAccessService,
    private readonly notifications: NotificationsService,
    private readonly targeting: RestaurantPromotionTargetingService,
  ) {}
  async list(userId: string, params: { status?: string; search?: string; page: number; limit: number }) {
    const restaurantId = await this.access.getRestaurantId(userId)
    const where: Prisma.PromotionWhereInput = {
      restaurantId,
      ...(params.status ? { status: params.status as PromotionStatus } : {}),
      ...(params.search ? { OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ] } : {}),
    }
    const [promotions, total, analytics] = await Promise.all([
      this.prisma.promotion.findMany({
        where, include: { items: true }, orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit, take: params.limit,
      }),
      this.prisma.promotion.count({ where }),
      this.getAnalyticsSummaryForRestaurant(restaurantId),
    ])
    return { promotions: promotions.map(promotion => this.serialize(promotion)), total, analytics }
  }

  async get(userId: string, id: string) {
    const promotion = await this.findOwned(userId, id)
    const usages = await this.prisma.promotionUsage.findMany({
      where: { promotionId: promotion.id },
      select: promotionUsageAnalyticsSelect,
      orderBy: { usedAt: 'asc' },
    })
    return { promotion: this.serialize(promotion), analytics: buildPromotionAnalytics(usages, promotion.usageLimit) }
  }

  async create(userId: string, dto: CreateRestaurantPromotionDto) {
    const restaurantId = await this.access.getRestaurantId(userId)
    if (await this.prisma.promotion.findUnique({ where: { code: dto.code } })) {
      throw new ConflictException('PROMOTION_CODE_EXISTS')
    }
    await this.assertNoOverlap(restaurantId, dto)
    const promotion = await this.prisma.promotion.create({
      data: {
        restaurantId, createdById: userId, code: dto.code, name: dto.name,
        description: dto.description, type: mapPromotionType(dto.type), value: dto.discountValue,
        minOrderAmount: dto.minOrderVnd ?? 0, maxDiscount: dto.maxDiscountVnd,
        usageLimit: dto.maxUsage ?? 2_147_483_647, maxPerUser: dto.perUserLimit,
        startsAt: new Date(dto.schedule.validFrom), expiresAt: new Date(dto.schedule.validUntil),
        status: (dto.status ?? 'draft') as PromotionStatus,
        isActive: dto.status === 'active', isStackable: dto.stackable,
        targeting: dto.target as Prisma.InputJsonValue,
        recurrence: (dto.schedule.recurring ?? dto.comboConfig) as Prisma.InputJsonValue | undefined,
        channels: dto.channels,
        items: { create: buildPromotionScope(dto) },
      },
      include: { items: true },
    })
    return { promotion: this.serialize(promotion) }
  }

  async update(userId: string, id: string, dto: UpdateRestaurantPromotionDto) {
    const existing = await this.findOwned(userId, id)
    const startsAt = dto.schedule?.validFrom ? new Date(dto.schedule.validFrom) : existing.startsAt
    const expiresAt = dto.schedule?.validUntil ? new Date(dto.schedule.validUntil) : existing.expiresAt
    await this.assertNoOverlap(existing.restaurantId!, {
      startsAt, expiresAt,
      stackable: dto.stackable ?? existing.isStackable,
      itemIds: dto.itemIds ?? existing.items.map(item => item.menuItemId).filter(Boolean) as string[],
      categoryId: dto.categoryId ?? existing.items.find(item => item.categoryId)?.categoryId ?? undefined,
      appliesTo: dto.appliesTo ?? (existing.items.length ? 'items' : 'all'),
    }, id)
    const promotion = await this.prisma.$transaction(async tx => {
      if (dto.appliesTo || dto.itemIds || dto.categoryId) {
        await tx.promotionItem.deleteMany({ where: { promotionId: id } })
      }
      return tx.promotion.update({
        where: { id },
        data: {
          ...(dto.code !== undefined ? { code: dto.code } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.type !== undefined ? { type: mapPromotionType(dto.type) } : {}),
          ...(dto.discountValue !== undefined ? { value: dto.discountValue } : {}),
          ...(dto.minOrderVnd !== undefined ? { minOrderAmount: dto.minOrderVnd } : {}),
          ...(dto.maxDiscountVnd !== undefined ? { maxDiscount: dto.maxDiscountVnd } : {}),
          ...(dto.maxUsage !== undefined ? { usageLimit: dto.maxUsage } : {}),
          ...(dto.perUserLimit !== undefined ? { maxPerUser: dto.perUserLimit } : {}),
          ...(dto.status !== undefined ? { status: dto.status as PromotionStatus, isActive: dto.status === 'active' } : {}),
          ...(dto.stackable !== undefined ? { isStackable: dto.stackable } : {}),
          ...(dto.target !== undefined ? { targeting: dto.target as Prisma.InputJsonValue } : {}),
          ...(dto.channels !== undefined ? { channels: dto.channels } : {}),
          ...(dto.schedule ? { startsAt, expiresAt, recurrence: dto.schedule.recurring as Prisma.InputJsonValue | undefined } : {}),
          ...(dto.appliesTo || dto.itemIds || dto.categoryId
            ? { items: { create: buildPromotionScope(dto) } }
            : {}),
        },
        include: { items: true },
      })
    })
    return { promotion: this.serialize(promotion) }
  }

  async remove(userId: string, id: string) {
    const promotion = await this.findOwned(userId, id)
    if (promotion.usageCount > 0) throw new ConflictException('PROMOTION_HAS_USAGE')
    await this.prisma.promotion.delete({ where: { id } })
    return { deleted: true }
  }

  async bulk(userId: string, dto: BulkPromotionDto) {
    const restaurantId = await this.access.getRestaurantId(userId)
    const status = dto.action === 'pause' ? 'paused' : dto.action === 'resume' ? 'active' : 'archived'
    const result = await this.prisma.promotion.updateMany({
      where: { id: { in: dto.ids }, restaurantId },
      data: { status, isActive: status === 'active' },
    })
    return { updated: result.count }
  }

  async broadcast(userId: string, id: string) {
    const promotion = await this.findOwned(userId, id)
    const customerIds = await this.targeting.resolveCustomerIds(
      userId,
      toPromotionTargetingQuery(promotion.targeting),
    )
    const customers = await this.prisma.user.findMany({
      where: { id: { in: customerIds }, role: 'customer', isActive: true },
      select: { id: true },
      take: 5000,
    })
    const results = await settlePromotionNotificationBatches(
      customers.map(customer => customer.id),
      customerId => this.notifications.create({
        userId: customerId,
        title: promotion.name,
        body: promotion.description ?? `Mã ưu đãi ${promotion.code} đang có hiệu lực.`,
        type: 'promotion.broadcast',
        payload: { promotionId: promotion.id, code: promotion.code },
      }),
    )
    return {
      targeted: customers.length,
      sent: results.filter(result => result.status === 'fulfilled').length,
    }
  }

  private findOwned(userId: string, id: string) {
    return this.access.getRestaurantId(userId).then(restaurantId =>
      this.prisma.promotion.findFirstOrThrow({ where: { id, restaurantId }, include: { items: true } }))
  }

  private async getAnalyticsSummaryForRestaurant(restaurantId: string) {
    const promotions = await this.prisma.promotion.findMany({
      where: { restaurantId },
      select: {
        usageLimit: true,
        usages: { select: promotionUsageAnalyticsSelect },
      },
    })
    return buildPromotionAnalyticsSummary(promotions)
  }

  private async assertNoOverlap(
    restaurantId: string,
    dto: CreateRestaurantPromotionDto | { startsAt: Date; expiresAt: Date; stackable: boolean; itemIds: string[]; categoryId?: string; appliesTo: string },
    excludeId?: string,
  ) {
    if (dto.stackable) return
    const startsAt = 'schedule' in dto ? new Date(dto.schedule.validFrom) : dto.startsAt
    const expiresAt = 'schedule' in dto ? new Date(dto.schedule.validUntil) : dto.expiresAt
    const candidates = await this.prisma.promotion.findMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined, restaurantId, isStackable: false,
        status: { in: ['scheduled', 'active'] }, startsAt: { lt: expiresAt }, expiresAt: { gt: startsAt },
      },
      include: { items: true },
    })
    const scope = buildPromotionScope(dto)
    const overlaps = candidates.some(candidate => promotionScopesIntersect(candidate.items, scope))
    if (overlaps) throw new ConflictException('PROMOTION_SCOPE_OVERLAP')
  }

  private serialize(promotion: Awaited<ReturnType<RestaurantPromotionsService['findOwned']>>) {
    const itemIds = promotion.items.flatMap(item => item.menuItemId ? [item.menuItemId] : [])
    const categoryId = promotion.items.find(item => item.categoryId)?.categoryId ?? undefined
    return {
      id: promotion.id, code: promotion.code, name: promotion.name, description: promotion.description,
      type: unmapPromotionType(promotion.type), discountValue: Number(promotion.value),
      minOrderVnd: Number(promotion.minOrderAmount), maxDiscountVnd: promotion.maxDiscount ? Number(promotion.maxDiscount) : undefined,
      appliesTo: categoryId ? 'category' : itemIds.length ? 'items' : 'all', categoryId, itemIds,
      target: promotion.targeting ?? { audience: 'all' },
      schedule: { validFrom: promotion.startsAt, validUntil: promotion.expiresAt, recurring: promotion.recurrence },
      channels: promotion.channels, stackable: promotion.isStackable, maxUsage: promotion.usageLimit,
      perUserLimit: promotion.maxPerUser ?? 1, usageCount: promotion.usageCount,
      status: promotion.status, createdAt: promotion.createdAt,
      createdBy: promotion.createdById ?? 'system',
    }
  }
}
