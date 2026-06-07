import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
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
  ) {}

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
      if (!promotion) throw new NotFoundException('Mã khuyến mãi không tồn tại')

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
    if (!promotion) throw new NotFoundException('Mã khuyến mãi không tồn tại')
    return promotion
  }
}
