import { Prisma, RestaurantApprovalStatus } from '@prisma/client'

export type FoodRecommendationReason = 'recent_order' | 'popular_available'
export type FoodRecommendationSource = 'order_history' | 'available_catalog' | 'mixed'

export interface RecommendedMenuItemRecord {
  id: string
  name: string
  basePrice: unknown
  isAvailable?: boolean
  isPopular: boolean
  category: { name: string; isVisible?: boolean } | null
  restaurant: {
    id: string
    name: string
    rating: unknown
    cuisineTypes: string[]
    prepTimeAvgMinutes: number
    priceRange: string
    isActive?: boolean
    isOpen?: boolean
    approvalStatus?: RestaurantApprovalStatus
  }
}

export interface FoodRecommendationItem {
  menuItemId: string
  name: string
  restaurantId: string
  restaurantName: string
  categoryName: string | null
  basePrice: number
  rating: number
  cuisineTypes: string[]
  prepTimeAvgMinutes: number
  priceRange: string
  isPopular: boolean
  reason: FoodRecommendationReason
}

export interface FoodRecommendationResult {
  source: FoodRecommendationSource
  items: FoodRecommendationItem[]
  generatedAt: string
}

export function toFoodRecommendation(
  item: RecommendedMenuItemRecord,
  reason: FoodRecommendationReason,
): FoodRecommendationItem {
  return {
    menuItemId: item.id,
    name: item.name,
    restaurantId: item.restaurant.id,
    restaurantName: item.restaurant.name,
    categoryName: item.category?.name ?? null,
    basePrice: toNumber(item.basePrice),
    rating: toNumber(item.restaurant.rating),
    cuisineTypes: item.restaurant.cuisineTypes,
    prepTimeAvgMinutes: item.restaurant.prepTimeAvgMinutes,
    priceRange: item.restaurant.priceRange,
    isPopular: item.isPopular,
    reason,
  }
}

export function mergeFoodRecommendations(
  recentItems: RecommendedMenuItemRecord[],
  popularItems: RecommendedMenuItemRecord[],
  limit = 10,
): FoodRecommendationResult {
  const items: FoodRecommendationItem[] = []
  const seen = new Set<string>()

  const append = (item: RecommendedMenuItemRecord, reason: FoodRecommendationReason): void => {
    if (seen.has(item.id) || items.length >= limit) return
    seen.add(item.id)
    items.push(toFoodRecommendation(item, reason))
  }

  recentItems.forEach(item => append(item, 'recent_order'))
  popularItems.forEach(item => append(item, 'popular_available'))

  return {
    source: resolveSource(items),
    items,
    generatedAt: new Date().toISOString(),
  }
}

export const recommendedMenuItemSelect = {
  id: true,
  name: true,
  basePrice: true,
  isAvailable: true,
  isPopular: true,
  category: { select: { name: true, isVisible: true } },
  restaurant: {
    select: {
      id: true,
      name: true,
      rating: true,
      cuisineTypes: true,
      prepTimeAvgMinutes: true,
      priceRange: true,
      isActive: true,
      isOpen: true,
      approvalStatus: true,
    },
  },
} satisfies Prisma.MenuItemSelect

export function availableRecommendationWhere(): Prisma.MenuItemWhereInput {
  return {
    isAvailable: true,
    category: { isVisible: true },
    restaurant: {
      isActive: true,
      isOpen: true,
      approvalStatus: RestaurantApprovalStatus.approved,
    },
  }
}

export function isAvailableRecommendedMenuItem(item: RecommendedMenuItemRecord): boolean {
  return item.isAvailable === true
    && item.category?.isVisible === true
    && item.restaurant.isActive === true
    && item.restaurant.isOpen === true
    && item.restaurant.approvalStatus === RestaurantApprovalStatus.approved
}

function resolveSource(items: FoodRecommendationItem[]): FoodRecommendationSource {
  const hasRecent = items.some(item => item.reason === 'recent_order')
  const hasPopular = items.some(item => item.reason === 'popular_available')
  if (hasRecent && hasPopular) return 'mixed'
  if (hasRecent) return 'order_history'
  return 'available_catalog'
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (value && typeof value === 'object' && 'toString' in value) return Number(value.toString())
  return 0
}
