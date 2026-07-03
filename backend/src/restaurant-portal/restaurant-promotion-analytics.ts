import { Prisma } from '@prisma/client'

export interface PromotionUsageAnalyticsRow {
  discountAmount: unknown
  usedAt: Date
  order: { total: unknown } | null
}

export interface PromotionAnalytics {
  usageCount: number
  revenueAttributed: number
  discountGiven: number
  redemptionRate: number
  roi: number
  usageTimeline: Array<{
    date: string
    count: number
    revenueAttributed: number
    discountGiven: number
  }>
}

export const promotionUsageAnalyticsSelect = {
  discountAmount: true,
  usedAt: true,
  order: { select: { total: true } },
} satisfies Prisma.PromotionUsageSelect

export function buildPromotionAnalytics(
  usages: PromotionUsageAnalyticsRow[],
  usageLimit?: number | null,
): PromotionAnalytics {
  return calculateAnalytics(usages, finiteUsageLimit(usageLimit))
}

export function buildPromotionAnalyticsSummary(
  promotions: Array<{ usageLimit: number; usages: PromotionUsageAnalyticsRow[] }>,
): PromotionAnalytics {
  const usages = promotions.flatMap(promotion => promotion.usages)
  const usageLimit = promotions.reduce((sum, promotion) => sum + finiteUsageLimit(promotion.usageLimit), 0)
  return calculateAnalytics(usages, usageLimit)
}

function calculateAnalytics(usages: PromotionUsageAnalyticsRow[], usageLimit: number): PromotionAnalytics {
  const usageCount = usages.length
  const revenueAttributed = usages.reduce((sum, usage) => sum + toNumber(usage.order?.total), 0)
  const discountGiven = usages.reduce((sum, usage) => sum + toNumber(usage.discountAmount), 0)
  const timeline = new Map<string, { count: number; revenueAttributed: number; discountGiven: number }>()

  for (const usage of usages) {
    const date = usage.usedAt.toISOString().slice(0, 10)
    const current = timeline.get(date) ?? { count: 0, revenueAttributed: 0, discountGiven: 0 }
    current.count += 1
    current.revenueAttributed += toNumber(usage.order?.total)
    current.discountGiven += toNumber(usage.discountAmount)
    timeline.set(date, current)
  }

  return {
    usageCount,
    revenueAttributed,
    discountGiven,
    redemptionRate: usageLimit > 0 ? round1(usageCount / usageLimit * 100) : 0,
    roi: discountGiven > 0 ? round1((revenueAttributed - discountGiven) / discountGiven * 100) : 0,
    usageTimeline: Array.from(timeline, ([date, value]) => ({ date, ...value }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

function finiteUsageLimit(value: number | null | undefined): number {
  if (!value || value >= 2_147_483_647) return 0
  return value
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (value && typeof value === 'object' && 'toString' in value) return Number(value.toString())
  return 0
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
