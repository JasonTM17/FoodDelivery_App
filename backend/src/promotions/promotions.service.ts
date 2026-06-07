import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common'
import { I18nService, I18nContext } from 'nestjs-i18n'
import { PrismaService } from '../database/prisma.service'
import { EligibilityService } from './eligibility.service'
import { FraudDetectionService } from './fraud-detection.service'
import { CartContext } from './promotions.types'
import { fallbackT } from '../i18n/fallback-translations'

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibility: EligibilityService,
    private readonly fraud: FraudDetectionService,
    @Optional() private readonly i18n?: I18nService,
  ) {}

  private t(key: string): string {
    if (!this.i18n) return fallbackT(key)
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

    const discountAmount = await this.prisma.$transaction(async (tx) => {
      // Row-level lock: serialises concurrent claims for the same code
      await tx.$executeRaw`SELECT 1 FROM promotions WHERE code = ${code} FOR UPDATE`

      const promotion = await tx.promotion.findUnique({ where: { code } })
      if (!promotion) throw new NotFoundException(this.t('errors.promotion_not_found'))

      const result = await this.eligibility.validate(promotion, cart, userId)
      if (!result.valid) throw new BadRequestException(result.error)

      await tx.promotion.update({
        where: { id: promotion.id },
        data: { currentUsageCount: { increment: 1 } },
      })

      await tx.promotionUsage.create({
        data: {
          promotionId: promotion.id,
          userId,
          orderId,
          discountAmount: result.discountAmount!,
        },
      })

      return result.discountAmount!
    })

    // Record device claim only after DB commit succeeds
    if (deviceFingerprint) {
      await this.fraud.record(deviceFingerprint)
    }

    return { discountAmount }
  }

  async findByCode(code: string) {
    const promotion = await this.prisma.promotion.findUnique({ where: { code } })
    if (!promotion) throw new NotFoundException(this.t('errors.promotion_not_found'))
    return promotion
  }
}
