import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client'
import {
  isWalletPaymentMethod,
  normalizeOrderPaymentMethod,
  toPublicPaymentMethod,
} from './payment-methods'
import { PaymentMethodDto } from './orders.dto'

describe('payment method mapping', () => {
  it('keeps public wallet separate from the legacy database enum', () => {
    expect(normalizeOrderPaymentMethod(PaymentMethodDto.wallet)).toBe(PrismaPaymentMethod.mock_wallet)
    expect(toPublicPaymentMethod(PrismaPaymentMethod.mock_wallet)).toBe('wallet')
    expect(isWalletPaymentMethod(PrismaPaymentMethod.mock_wallet)).toBe(true)
  })

  it('passes through non-wallet payment methods', () => {
    expect(normalizeOrderPaymentMethod(PaymentMethodDto.cash)).toBe(PrismaPaymentMethod.cash)
    expect(normalizeOrderPaymentMethod(PaymentMethodDto.sepay)).toBe(PrismaPaymentMethod.sepay)
    expect(toPublicPaymentMethod(PrismaPaymentMethod.cash)).toBe('cash')
    expect(toPublicPaymentMethod(PrismaPaymentMethod.sepay)).toBe('sepay')
  })
})
