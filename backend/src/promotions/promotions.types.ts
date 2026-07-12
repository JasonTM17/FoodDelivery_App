export interface CartContext {
  subtotal: number
  restaurantId: string
  /** Actual delivery fee for free_delivery clamp (default 0). */
  deliveryFee?: number
  /** Menu item ids in cart — used for item-scoped promos. */
  menuItemIds?: string[]
  /** Category ids of cart items — used for category-scoped promos. */
  categoryIds?: string[]
}

export interface ValidationResult {
  valid: boolean
  error?: string
  discountAmount?: number
}

export interface FraudCheckResult {
  blocked: boolean
  reason: string
}

export interface StackingCandidate {
  code: string
  type: 'percentage' | 'fixed' | 'free_delivery'
  discountAmount: number
}

export interface StackingResult {
  accepted: StackingCandidate[]
  rejected: StackingCandidate[]
  reason?: string
  totalDiscount: number
}
