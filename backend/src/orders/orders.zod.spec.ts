import { placeOrderSchema } from './orders.zod'

describe('placeOrderSchema', () => {
  it('accepts the public wallet payment method', () => {
    const parsed = placeOrderSchema.parse({
      addressId: '11111111-1111-4111-8111-111111111111',
      paymentMethod: 'wallet',
    })

    expect(parsed.paymentMethod).toBe('wallet')
  })

  it('rejects the obsolete wallet storage value as a public request value', () => {
    expect(() => placeOrderSchema.parse({
      addressId: '11111111-1111-4111-8111-111111111111',
      paymentMethod: 'mock_wallet',
    })).toThrow()
  })

  it('accepts sepay payment method', () => {
    const parsed = placeOrderSchema.parse({
      addressId: '11111111-1111-4111-8111-111111111111',
      paymentMethod: 'sepay',
    })

    expect(parsed.paymentMethod).toBe('sepay')
  })
})
