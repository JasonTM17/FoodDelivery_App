import { Injectable, Optional } from '@nestjs/common'
import { I18nService, I18nContext } from 'nestjs-i18n'
import { Promotion } from '@prisma/client'
import { StackingCandidate, StackingResult } from './promotions.types'
import { fallbackT } from '../i18n/fallback-translations'

export type PromotionWithDiscount = Promotion & { discountAmount: number }

@Injectable()
export class StackingService {
  constructor(@Optional() private readonly i18n?: I18nService) {}

  // Translates key; falls back to vi strings when I18nService is absent (unit tests).
  private t(key: string): string {
    if (!this.i18n) return fallbackT(key)
    return this.i18n.t(key, { lang: I18nContext.current()?.lang ?? 'vi' })
  }

  /**
   * Stacking rules:
   *   - At most 1 percentage promotion (highest discount wins)
   *   - At most 1 free_delivery promotion (highest discount wins)
   *   - fixed promotions are standalone-only; rejected when mixed with other types
   *   - If all submitted promos are fixed, accept the highest-discount one
   */
  combine(promos: PromotionWithDiscount[]): StackingResult {
    if (promos.length === 0) {
      return { accepted: [], rejected: [], totalDiscount: 0 }
    }

    if (promos.length === 1) {
      const only = promos[0]
      return {
        accepted: [toCandidate(only)],
        rejected: [],
        totalDiscount: only.discountAmount,
      }
    }

    const hasNonFixed = promos.some((p) => p.type !== 'fixed')
    const sorted = [...promos].sort((a, b) => b.discountAmount - a.discountAmount)
    const accepted: StackingCandidate[] = []
    const rejected: StackingCandidate[] = []
    let hasPercent = false
    let hasFreeDelivery = false
    let hasFixedAccepted = false

    for (const p of sorted) {
      const candidate = toCandidate(p)

      if (p.type === 'fixed') {
        // Fixed cannot mix with other types; if no non-fixed present, accept best one
        if (hasNonFixed || hasFixedAccepted) {
          rejected.push(candidate)
        } else {
          accepted.push(candidate)
          hasFixedAccepted = true
        }
        continue
      }

      if (p.type === 'percentage') {
        hasPercent ? rejected.push(candidate) : (accepted.push(candidate), (hasPercent = true))
        continue
      }

      if (p.type === 'free_delivery') {
        hasFreeDelivery
          ? rejected.push(candidate)
          : (accepted.push(candidate), (hasFreeDelivery = true))
        continue
      }

      rejected.push(candidate)
    }

    const totalDiscount = accepted.reduce((sum, p) => sum + p.discountAmount, 0)

    let reason: string | undefined
    if (rejected.length > 0) {
      const hasRejectedFixed = rejected.some((p) => p.type === 'fixed')
      reason = hasRejectedFixed
        ? this.t('errors.promotion_fixed_cannot_stack')
        : this.t('errors.promotion_one_per_type')
    }

    return { accepted, rejected, reason, totalDiscount }
  }
}

function toCandidate(p: PromotionWithDiscount): StackingCandidate {
  return {
    code: p.code,
    type: p.type as StackingCandidate['type'],
    discountAmount: p.discountAmount,
  }
}
