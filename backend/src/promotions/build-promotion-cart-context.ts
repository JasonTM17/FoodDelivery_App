import type { CartContext } from './promotions.types'

export type PromotionCartLine = {
  menuItemId: string
  unitPrice?: unknown
  quantity?: number
  menuItem?: { categoryId?: string | null } | null
  categoryId?: string | null
}

/**
 * Canonical promotion cart context for preview and transactional claim.
 * Preview and checkout must pass identical shape so scoped promos stay consistent.
 */
export function buildPromotionCartContext(input: {
  subtotal: number
  restaurantId: string
  deliveryFee: number
  items: PromotionCartLine[]
}): CartContext {
  const menuItemIds = [...new Set(input.items.map((item) => item.menuItemId).filter(Boolean))]
  const categoryIds = [
    ...new Set(
      input.items
        .map((item) => item.menuItem?.categoryId ?? item.categoryId ?? null)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ]

  return {
    subtotal: input.subtotal,
    restaurantId: input.restaurantId,
    deliveryFee: input.deliveryFee,
    menuItemIds,
    categoryIds,
  }
}
