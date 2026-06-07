import { Injectable, Optional } from '@nestjs/common'
import { I18nService, I18nContext } from 'nestjs-i18n'
import { Promotion } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { CartContext, ValidationResult } from './promotions.types'
import { fallbackT } from '../i18n/fallback-translations'

@Injectable()
export class EligibilityService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly i18n?: I18nService,
  ) {}

  // Translates key; falls back to vi strings when I18nService is absent (unit tests).
  private t(key: string, args?: Record<string, unknown>): string {
    if (!this.i18n) return fallbackT(key, args)
    return this.i18n.t(key, { lang: I18nContext.current()?.lang ?? 'vi', args })
  }

  async validate(
    promotion: Promotion,
    cart: CartContext,
    userId: string,
  ): Promise<ValidationResult> {
    if (!promotion.isActive) {
      return { valid: false, error: this.t('errors.promotion_invalid') }
    }

    const now = new Date()
    if (now < promotion.startsAt || now > promotion.expiresAt) {
      return { valid: false, error: this.t('errors.promotion_expired') }
    }

    if (promotion.currentUsageCount >= promotion.usageLimit) {
      return { valid: false, error: this.t('errors.promotion_exhausted') }
    }

    if (Number(promotion.minOrderAmount) > 0 && cart.subtotal < Number(promotion.minOrderAmount)) {
      const amount = Number(promotion.minOrderAmount).toLocaleString('vi-VN')
      return { valid: false, error: this.t('errors.promotion_min_order', { amount }) }
    }

    if (promotion.restaurantId && promotion.restaurantId !== cart.restaurantId) {
      return { valid: false, error: this.t('errors.promotion_wrong_restaurant') }
    }

    if (promotion.firstOrderOnly) {
      const orderCount = await this.prisma.order.count({ where: { customerId: userId } })
      if (orderCount > 0) {
        return { valid: false, error: this.t('errors.promotion_first_order_only') }
      }
    }

    if (promotion.maxPerUser != null) {
      const usageCount = await this.prisma.promotionUsage.count({
        where: { promotionId: promotion.id, userId },
      })
      if (usageCount >= promotion.maxPerUser) {
        return {
          valid: false,
          error: this.t('errors.promotion_max_per_user', { max: promotion.maxPerUser }),
        }
      }
    }

    return { valid: true, discountAmount: this.calculateDiscount(promotion, cart.subtotal) }
  }

  calculateDiscount(promotion: Promotion, subtotal: number): number {
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

    // free_delivery: value represents the delivery fee waived
    return value
  }
}
