import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client'
import type { PlaceOrderDto } from './orders.dto'

export type PublicPaymentMethod = 'cash' | 'wallet' | 'sepay'

/**
 * The database still has the legacy enum value `mock_wallet`.
 * Keep that storage detail isolated here so runtime/public behavior can use
 * `wallet` consistently until the dedicated payment enum migration lands.
 */
export function normalizeOrderPaymentMethod(method: PlaceOrderDto['paymentMethod']): PrismaPaymentMethod {
  if (method === 'wallet') return PrismaPaymentMethod.mock_wallet
  return method as unknown as PrismaPaymentMethod
}

export function toPublicPaymentMethod(method: PrismaPaymentMethod | string): PublicPaymentMethod | string {
  if (method === PrismaPaymentMethod.mock_wallet) return 'wallet'
  return method
}

export function isWalletPaymentMethod(method: PrismaPaymentMethod | string): boolean {
  return toPublicPaymentMethod(method) === 'wallet'
}
