import { placeOrderSchema } from './orders.zod'

describe('placeOrderSchema', () => {
  it('normalizes public wallet payment method to legacy Prisma value', () => {
    const parsed = placeOrderSchema.parse({
      addressId: '11111111-1111-4111-8111-111111111111',
      paymentMethod: 'wallet',
    })

    expect(parsed.paymentMethod).toBe('mock_wallet')
  })

  it('accepts sepay payment method', () => {
    const parsed = placeOrderSchema.parse({
      addressId: '11111111-1111-4111-8111-111111111111',
      paymentMethod: 'sepay',
    })

    expect(parsed.paymentMethod).toBe('sepay')
  })
})
