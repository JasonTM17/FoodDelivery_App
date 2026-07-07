import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import type { Prisma, Promotion } from '@prisma/client'
import { I18nService, I18nContext } from 'nestjs-i18n'
import { PrismaService } from '../database/prisma.service'
import { EligibilityService } from './eligibility.service'
import { FraudDetectionService } from './fraud-detection.service'
import { CartContext } from './promotions.types'

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibility: EligibilityService,
    private readonly fraud: FraudDetectionService,
    private readonly i18n: I18nService,
  ) {}

  private t(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang ?? 'vi' })
  }

  /**
   * Atomically validates and claims a promotion code.
   * Uses a FOR UPDATE row-lock so two concurrent claims of the last slot
   * result in exactly one success and one "đã hết lượt" error.
   */
  async validateAndClaim(
    code: string,
    cart: CartContext,
    userId: string,
    orderId: string,
    deviceFingerprint?: string,
  ): Promise<{ discountAmount: number }> {
    if (deviceFingerprint) {
      const { blocked, reason } = await this.fraud.check(deviceFingerprint)
      if (blocked) throw new BadRequestException(reason)
    }

    const { discountAmount } = await this.prisma.$transaction((tx) =>
      this.claimInTransaction(tx, code, cart, userId, orderId),
    )

    // Record device claim only after DB commit succeeds
    if (deviceFingerprint) {
      await this.fraud.record(deviceFingerprint)
    }

    return { discountAmount }
  }

  async preview(code: string, cart: CartContext, userId: string): Promise<{ discountAmount: number }> {
    const promotion = await this.prisma.promotion.findUnique({ where: { code } })
    if (!promotion) throw new NotFoundException(this.t('errors.promotion_not_found'))

    const result = await this.eligibility.validate(promotion, cart, userId)
    if (!result.valid) throw new BadRequestException(result.error)

    return { discountAmount: result.discountAmount! }
  }

  async claimInTransaction(
    tx: Prisma.TransactionClient,
    code: string,
    cart: CartContext,
    userId: string,
    orderId: string,
  ): Promise<{ discountAmount: number }> {
    // Row-level lock: serialises concurrent claims for the same code.
    await tx.$executeRaw`SELECT 1 FROM promotions WHERE code = ${code} FOR UPDATE`

    const promotion = await tx.promotion.findUnique({ where: { code } })
    if (!promotion) throw new NotFoundException(this.t('errors.promotion_not_found'))

    const result = await this.eligibility.validate(promotion, cart, userId, tx)
    if (!result.valid) throw new BadRequestException(result.error)

    await tx.promotion.update({
      where: { id: promotion.id },
      data: {
        usageCount: { increment: 1 },
        currentUsageCount: { increment: 1 },
      },
    })

    await tx.promotionUsage.create({
      data: {
        promotionId: promotion.id,
        userId,
        orderId,
        discountAmount: result.discountAmount!,
      },
    })

    return { discountAmount: result.discountAmount! }
  }

  async findByCode(code: string) {
    const promotion = await this.prisma.promotion.findUnique({ where: { code } })
    if (!promotion) throw new NotFoundException(this.t('errors.promotion_not_found'))
    return promotion
  }

  async listAvailable(userId: string) {
    const now = new Date()
    const [promotions, usageCounts, orderCount] = await Promise.all([
      this.prisma.promotion.findMany({
        where: {
          isActive: true,
          status: 'active',
          startsAt: { lte: now },
          expiresAt: { gt: now },
        },
        orderBy: { expiresAt: 'asc' },
        take: 100,
      }),
      this.prisma.promotionUsage.groupBy({
        by: ['promotionId'],
        where: { userId },
        _count: { _all: true },
      }),
      this.prisma.order.count({ where: { customerId: userId } }),
    ])
    const usageByPromotion = new Map(
      usageCounts.map(row => [row.promotionId, row._count._all]),
    )
    return promotions
      .filter(promotion => promotion.currentUsageCount < promotion.usageLimit)
      .filter(promotion => !promotion.firstOrderOnly || orderCount === 0)
      .filter(promotion => {
        if (promotion.maxPerUser == null) return true
        return (usageByPromotion.get(promotion.id) ?? 0) < promotion.maxPerUser
      })
      .map(promotion => this.serializeForCustomer(promotion, false, 'available'))
  }

  async listMine(userId: string) {
    const usages = await this.prisma.promotionUsage.findMany({
      where: { userId },
      include: { promotion: true },
      orderBy: { usedAt: 'desc' },
      take: 100,
    })
    const seen = new Set<string>()
    return usages.flatMap(usage => {
      if (seen.has(usage.promotionId)) return []
      seen.add(usage.promotionId)
      return [this.serializeForCustomer(usage.promotion, true, 'used', usage.usedAt)]
    })
  }

  private serializeForCustomer(
    promotion: Promotion,
    isUsed: boolean,
    status: 'available' | 'used',
    usedAt?: Date,
  ) {
    const value = Number(promotion.value)
    const percentOff = promotion.type === 'percentage' ? Math.round(value) : null
    return {
      id: promotion.id,
      code: promotion.code,
      title: promotion.name || promotion.code,
      name: promotion.name || promotion.code,
      description: promotion.description ?? '',
      type: promotion.type,
      value,
      discountPercent: percentOff ?? 0,
      percentOff,
      fixedAmount: promotion.type === 'fixed' ? value : null,
      maxDiscount: promotion.maxDiscount == null ? null : Number(promotion.maxDiscount),
      minOrderAmount: Number(promotion.minOrderAmount),
      restaurantId: promotion.restaurantId,
      expiresAt: promotion.expiresAt.toISOString(),
      isUsed,
      status,
      usedAt: usedAt?.toISOString() ?? null,
    }
  }
}
