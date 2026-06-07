export interface CartContext {
  subtotal: number
  restaurantId: string
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
