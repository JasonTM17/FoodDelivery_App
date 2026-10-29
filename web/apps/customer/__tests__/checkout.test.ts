import { describe, expect, it } from 'vitest';
import {
  buildPlaceOrderRequest,
  describeOrderError,
  isUuid,
  newIdempotencyKey,
} from '@/lib/checkout';

describe('newIdempotencyKey / isUuid', () => {
  it('generates a uuid v4', () => {
    const key = newIdempotencyKey();
    expect(isUuid(key)).toBe(true);
    expect(newIdempotencyKey()).not.toBe(key);
  });

  it('rejects non-uuid values', () => {
    expect(isUuid('abc')).toBe(false);
    expect(isUuid('')).toBe(false);
  });
});

describe('buildPlaceOrderRequest', () => {
  it('builds the POST /orders contract with an idempotency header', () => {
    const key = newIdempotencyKey();
    const request = buildPlaceOrderRequest(
      {
        addressId: 'addr-1',
        paymentMethod: 'cash',
        promotionCode: '  SALE10 ',
        notes: '  ring twice ',
      },
      key,
    );
    expect(request.path).toBe('/orders');
    expect(request.headers['X-Idempotency-Key']).toBe(key);
    expect(request.body).toEqual({
      addressId: 'addr-1',
      paymentMethod: 'cash',
      promotionCode: 'SALE10',
      notes: 'ring twice',
    });
  });

  it('omits promotion code and notes when blank', () => {
    const request = buildPlaceOrderRequest(
      { addressId: 'addr-1', paymentMethod: 'wallet', promotionCode: ' ', notes: '' },
      'key',
    );
    expect(request.body).toEqual({ addressId: 'addr-1', paymentMethod: 'wallet' });
  });
});

describe('describeOrderError', () => {
  const err = (code: string, detail?: string) => ({ code, detail, message: detail });

  it('maps backend problem codes to customer messages', () => {
    expect(describeOrderError(err('CART_EMPTY'))).toMatch(/cart is empty/i);
    expect(describeOrderError(err('MIN_ORDER_NOT_MET'))).toMatch(/minimum order/i);
    expect(describeOrderError(err('WALLET_INSUFFICIENT_BALANCE'))).toMatch(/wallet balance/i);
    expect(describeOrderError(err('AUTH_SESSION_EXPIRED'))).toMatch(/session has expired/i);
  });

  it('prefers backend detail for promotion errors', () => {
    expect(describeOrderError(err('PROMOTION_EXPIRED', 'Code expired yesterday'))).toBe(
      'Code expired yesterday',
    );
  });

  it('falls back to a generic message for unknown failures', () => {
    expect(describeOrderError(new Error('network down'))).toMatch(/could not place the order/i);
    expect(describeOrderError(undefined)).toMatch(/could not place the order/i);
  });
});
