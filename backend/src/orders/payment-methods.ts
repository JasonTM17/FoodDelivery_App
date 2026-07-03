import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client'
import type { PlaceOrderDto } from './orders.dto'

export type PublicPaymentMethod = 'cash' | 'wallet' | 'sepay'

export function normalizeOrderPaymentMethod(method: PlaceOrderDto['paymentMethod']): PrismaPaymentMethod {
  return method as unknown as PrismaPaymentMethod
}

export function toPublicPaymentMethod(method: PrismaPaymentMethod | string): PublicPaymentMethod | string {
  return method
}

export function isWalletPaymentMethod(method: PrismaPaymentMethod | string): boolean {
  return method === PrismaPaymentMethod.wallet || method === 'wallet'
}
