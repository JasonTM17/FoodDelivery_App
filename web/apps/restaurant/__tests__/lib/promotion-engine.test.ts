import { describe, expect, it } from 'vitest';
import {
  computeDiscountAmount,
  validatePromotion,
} from '@/lib/promotion-engine';
import type { Promotion } from '@/lib/types';

const validPromotion: Partial<Promotion> = {
  code: 'LUNCH20',
  name: 'Lunch discount',
  type: 'percent',
  discountValue: 20,
  schedule: {
    validFrom: new Date('2026-07-01T00:00:00.000Z'),
    validUntil: new Date('2026-07-31T23:59:59.000Z'),
  },
};

const invalidPromotionCases: Array<[Partial<Promotion>, string]> = [
  [{ code: 'A' }, 'short code'],
  [{ name: 'A' }, 'short name'],
  [{ discountValue: 0 }, 'zero discount'],
  [{ type: 'percent', discountValue: 101 }, 'percentage over 100'],
];

describe('validatePromotion', () => {
  it('accepts a complete percentage promotion', () => {
    expect(validatePromotion(validPromotion)).toEqual({ valid: true, errors: [] });
  });

  it.each(invalidPromotionCases)('rejects %s (%s)', (override) => {
    expect(validatePromotion({ ...validPromotion, ...override }).valid).toBe(false);
  });

  it('rejects legacy BOGOF promotions at the write boundary', () => {
    const result = validatePromotion({
      ...validPromotion,
      type: 'bogof',
      comboConfig: undefined,
    });

    expect(result).toMatchObject({ valid: false, errors: expect.arrayContaining(['invalidType']) });
  });

  it('requires a real category for category-scoped promotions', () => {
    const result = validatePromotion({
      ...validPromotion,
      appliesTo: 'category',
      categoryId: undefined,
    });

    expect(result).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(['categoryRequired']),
    });
  });

  it('requires at least one item for item-scoped promotions', () => {
    const result = validatePromotion({
      ...validPromotion,
      appliesTo: 'items',
      itemIds: [],
    });

    expect(result).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(['itemsRequired']),
    });
  });

  it('rejects an inverted schedule', () => {
    const result = validatePromotion({
      ...validPromotion,
      schedule: {
        validFrom: new Date('2026-08-01T00:00:00.000Z'),
        validUntil: new Date('2026-07-01T00:00:00.000Z'),
      },
    });

    expect(result.valid).toBe(false);
  });
});

describe('computeDiscountAmount', () => {
  it('caps percentage discounts', () => {
    expect(computeDiscountAmount('percent', 20, 500_000, 50_000)).toBe(50_000);
  });

  it('never discounts more than the order for fixed promotions', () => {
    expect(computeDiscountAmount('fixed', 100_000, 60_000)).toBe(60_000);
  });

  it('rounds percentage discounts to VND integers', () => {
    expect(computeDiscountAmount('percent', 15, 99_999)).toBe(15_000);
  });

  it('never returns a negative amount', () => {
    expect(computeDiscountAmount('fixed', -10, 100_000)).toBe(0);
  });
});
