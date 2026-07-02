import { PromotionType } from '@prisma/client'
import { PromotionTargetingPreviewQueryDto } from './restaurant-promotion.dto'

export function mapPromotionType(type: string): PromotionType {
  return ({ percent: 'percentage', bogof: 'bogo' }[type] ?? type) as PromotionType
}

export function unmapPromotionType(type: PromotionType): string {
  return ({ percentage: 'percent', bogo: 'bogof' }[type] ?? type)
}

export function buildPromotionScope(dto: {
  appliesTo?: string
  itemIds?: string[]
  categoryId?: string
}) {
  if (dto.appliesTo === 'category' && dto.categoryId) return [{ categoryId: dto.categoryId }]
  if (dto.appliesTo === 'items') return (dto.itemIds ?? []).map(menuItemId => ({ menuItemId }))
  return []
}

export function promotionScopesIntersect(
  left: Array<{ menuItemId: string | null; categoryId: string | null }>,
  right: Array<{ menuItemId?: string; categoryId?: string }>,
): boolean {
  if (left.length === 0 || right.length === 0) return true
  return left.some(a => right.some(b =>
    (a.menuItemId && a.menuItemId === b.menuItemId)
    || (a.categoryId && a.categoryId === b.categoryId)))
}

export function toPromotionTargetingQuery(value: unknown): PromotionTargetingPreviewQueryDto {
  const target = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  const audiences = ['all', 'new', 'vip', 'lapsed', 'segment', 'order_history'] as const
  const audience = audiences.find(candidate => candidate === target.audience) ?? 'all'

  return {
    audience,
    ...(typeof target.minOrderCount === 'number' ? { minOrderCount: target.minOrderCount } : {}),
    ...(typeof target.lastOrderWithinDays === 'number'
      ? { lastOrderWithinDays: target.lastOrderWithinDays }
      : {}),
    ...(typeof target.segmentId === 'string' ? { segmentId: target.segmentId } : {}),
  }
}
