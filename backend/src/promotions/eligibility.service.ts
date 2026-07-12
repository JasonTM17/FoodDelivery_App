import { Injectable } from '@nestjs/common'
import { I18nService, I18nContext } from 'nestjs-i18n'
import type { Prisma, Promotion } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { CartContext, ValidationResult } from './promotions.types'

@Injectable()
export class EligibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private t(key: string, args?: Record<string, unknown>): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang ?? 'vi', args })
  }

  async validate(
    promotion: Promotion,
    cart: CartContext,
    userId: string,
    db: Pick<
      Prisma.TransactionClient,
      'order' | 'promotionUsage' | 'promotionItem'
    > = this.prisma,
  ): Promise<ValidationResult> {
    if (!promotion.isActive || (promotion as { status?: string }).status === 'draft' || (promotion as { status?: string }).status === 'paused') {
      return { valid: false, error: this.t('errors.promotion_invalid') }
    }
    if (promotion.status && promotion.status !== 'active') {
      return { valid: false, error: this.t('errors.promotion_invalid') }
    }

    const now = new Date()
    if (now < promotion.startsAt || now > promotion.expiresAt) {
      return { valid: false, error: this.t('errors.promotion_expired') }
    }

    if (promotion.currentUsageCount >= promotion.usageLimit) {
      return { valid: false, error: this.t('errors.promotion_exhausted') }
    }

    if (promotion.budget != null && Number(promotion.usedBudget) >= Number(promotion.budget)) {
      return { valid: false, error: this.t('errors.promotion_exhausted') }
    }

    if (Number(promotion.minOrderAmount) > 0 && cart.subtotal < Number(promotion.minOrderAmount)) {
      const amount = Number(promotion.minOrderAmount).toLocaleString('vi-VN')
      return { valid: false, error: this.t('errors.promotion_min_order', { amount }) }
    }

    if (promotion.restaurantId && promotion.restaurantId !== cart.restaurantId) {
      return { valid: false, error: this.t('errors.promotion_wrong_restaurant') }
    }

    // Item / category scope via PromotionItem rows
    if ('promotionItem' in db && db.promotionItem) {
      const scoped = await db.promotionItem.findMany({
        where: { promotionId: promotion.id },
        select: { menuItemId: true, categoryId: true },
      })
      if (scoped.length > 0) {
        const menuIds = new Set(cart.menuItemIds ?? [])
        const catIds = new Set(cart.categoryIds ?? [])
        const matches = scoped.some(
          (row) =>
            (row.menuItemId && menuIds.has(row.menuItemId)) ||
            (row.categoryId && catIds.has(row.categoryId)),
        )
        if (!matches) {
          return { valid: false, error: this.t('errors.promotion_invalid') }
        }
      }
    }

    // Audience targeting JSON (optional): { userIds?: string[] }
    const targeting = promotion.targeting as { userIds?: string[] } | null
    if (targeting?.userIds?.length && !targeting.userIds.includes(userId)) {
      return { valid: false, error: this.t('errors.promotion_invalid') }
    }

    if (promotion.firstOrderOnly) {
      // Only count fulfilled / paid-side orders — abandoned/cancelled do not burn first-order promos
      const orderCount = await db.order.count({
        where: {
          customerId: userId,
          status: {
            notIn: ['created', 'pending_payment', 'cancelled', 'refunded'],
          },
        },
      })
      if (orderCount > 0) {
        return { valid: false, error: this.t('errors.promotion_first_order_only') }
      }
    }

    if (promotion.maxPerUser != null) {
      const usageCount = await db.promotionUsage.count({
        where: { promotionId: promotion.id, userId },
      })
      if (usageCount >= promotion.maxPerUser) {
        return {
          valid: false,
          error: this.t('errors.promotion_max_per_user', { max: promotion.maxPerUser }),
        }
      }
    }

    return {
      valid: true,
      discountAmount: this.calculateDiscount(promotion, cart.subtotal, cart.deliveryFee ?? 0),
    }
  }

  calculateDiscount(promotion: Promotion, subtotal: number, deliveryFee = 0): number {
    const value = Number(promotion.value)

    if (promotion.type === 'percentage') {
      let discount = Math.floor((subtotal * value) / 100)
      if (promotion.maxDiscount) {
        discount = Math.min(discount, Number(promotion.maxDiscount))
      }
      return discount
    }

    if (promotion.type === 'fixed') {
      return Math.min(value, subtotal)
    }

    // free_delivery: never waive more than the actual delivery fee
    return Math.min(value, Math.max(0, deliveryFee))
  }
}
