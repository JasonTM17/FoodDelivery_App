import { Injectable } from '@nestjs/common'
import { Promotion } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { CartContext, ValidationResult } from './promotions.types'

@Injectable()
export class EligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(
    promotion: Promotion,
    cart: CartContext,
    userId: string,
  ): Promise<ValidationResult> {
    if (!promotion.isActive) {
      return { valid: false, error: 'Mã khuyến mãi không hợp lệ' }
    }

    const now = new Date()
    if (now < promotion.startsAt || now > promotion.expiresAt) {
      return { valid: false, error: 'Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực' }
    }

    if (promotion.currentUsageCount >= promotion.usageLimit) {
      return { valid: false, error: 'Mã đã hết lượt dùng' }
    }

    if (Number(promotion.minOrderAmount) > 0 && cart.subtotal < Number(promotion.minOrderAmount)) {
      const formatted = Number(promotion.minOrderAmount).toLocaleString('vi-VN')
      return { valid: false, error: `Đơn tối thiểu phải đạt ${formatted}đ` }
    }

    if (promotion.restaurantId && promotion.restaurantId !== cart.restaurantId) {
      return { valid: false, error: 'Mã không áp dụng cho nhà hàng này' }
    }

    if (promotion.firstOrderOnly) {
      const orderCount = await this.prisma.order.count({ where: { customerId: userId } })
      if (orderCount > 0) {
        return { valid: false, error: 'Mã chỉ áp dụng cho đơn đầu tiên' }
      }
    }

    if (promotion.maxPerUser != null) {
      const usageCount = await this.prisma.promotionUsage.count({
        where: { promotionId: promotion.id, userId },
      })
      if (usageCount >= promotion.maxPerUser) {
        return {
          valid: false,
          error: `Bạn đã dùng mã này tối đa ${promotion.maxPerUser} lần`,
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
