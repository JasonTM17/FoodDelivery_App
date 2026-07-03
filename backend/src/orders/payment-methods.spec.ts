import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client'
import {
  isWalletPaymentMethod,
  normalizeOrderPaymentMethod,
  toPublicPaymentMethod,
} from './payment-methods'
import { PaymentMethodDto } from './orders.dto'

describe('payment method mapping', () => {
  it('stores wallet payments with the public database enum value', () => {
    expect(normalizeOrderPaymentMethod(PaymentMethodDto.wallet)).toBe(PrismaPaymentMethod.wallet)
    expect(toPublicPaymentMethod(PrismaPaymentMethod.wallet)).toBe('wallet')
    expect(isWalletPaymentMethod(PrismaPaymentMethod.wallet)).toBe(true)
  })

  it('passes through non-wallet payment methods', () => {
    expect(normalizeOrderPaymentMethod(PaymentMethodDto.cash)).toBe(PrismaPaymentMethod.cash)
    expect(normalizeOrderPaymentMethod(PaymentMethodDto.sepay)).toBe(PrismaPaymentMethod.sepay)
    expect(toPublicPaymentMethod(PrismaPaymentMethod.cash)).toBe('cash')
    expect(toPublicPaymentMethod(PrismaPaymentMethod.sepay)).toBe('sepay')
  })
})
