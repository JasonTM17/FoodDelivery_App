import type { ApiClientError } from '@/lib/api';

export type PaymentMethod = 'cash' | 'wallet' | 'sepay';
export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'wallet', 'sepay'];

export interface PlaceOrderInput {
  addressId: string;
  paymentMethod: PaymentMethod;
  promotionCode?: string;
  notes?: string;
}

export interface PlaceOrderRequest {
  path: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC4122 v4 fallback for older webviews.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Builds the exact POST /orders contract. The idempotency key is supplied by
 * the caller so a retry after a dropped response reuses the same key and the
 * backend can replay the cached result instead of double-placing the order.
 */
export function buildPlaceOrderRequest(
  input: PlaceOrderInput,
  idempotencyKey: string,
): PlaceOrderRequest {
  const body: Record<string, unknown> = {
    addressId: input.addressId,
    paymentMethod: input.paymentMethod,
  };
  const promo = input.promotionCode?.trim();
  if (promo) body.promotionCode = promo;
  const notes = input.notes?.trim();
  if (notes) body.notes = notes;

  return {
    path: '/orders',
    body,
    headers: { 'X-Idempotency-Key': idempotencyKey },
  };
}

/** Maps backend problem codes for placement/checkout to readable messages. */
export function describeOrderError(error: unknown): string {
  const apiError = error as ApiClientError | undefined;
  const code = apiError?.code;
  // Only surface server-provided detail; raw Error messages stay internal.
  const detail = apiError?.detail;

  switch (code) {
    case 'CART_EMPTY':
    case 'CART_NO_RESTAURANT':
      return 'Your cart is empty. Add items before checking out.';
    case 'RESTAURANT_CLOSED':
      return 'This restaurant is currently closed.';
    case 'ADDRESS_NOT_FOUND':
      return 'The selected delivery address is no longer available.';
    case 'MIN_ORDER_NOT_MET':
      return 'The order does not meet the restaurant minimum order amount.';
    case 'PROMOTION_INVALID':
    case 'PROMOTION_EXPIRED':
    case 'PROMOTION_NOT_APPLICABLE':
    case 'PROMOTION_USAGE_LIMIT':
      return detail || 'The promotion code could not be applied.';
    case 'WALLET_INSUFFICIENT_BALANCE':
      return 'Wallet balance is too low for this order.';
    case 'AUTH_SESSION_EXPIRED':
      return 'Your session has expired. Please sign in again.';
    default:
      return detail || 'Could not place the order. Please try again.';
  }
}
