import { describe, expect, it } from 'vitest';
import {
  toAdminPromotionPayload,
  toPromotionFormValues,
  type AdminPromotion,
} from '@/components/promotions/admin-promotions-types';
import type { PromotionFormValues } from '@/lib/schemas/promotion-schema';

const promotion: AdminPromotion = {
  id: 'promotion-1',
  code: 'WELCOME20',
  name: 'Welcome campaign',
  description: 'New customer offer',
  type: 'percentage',
  value: 20,
  minOrderAmount: 100_000,
  maxDiscount: 50_000,
  usageCount: 10,
  usageLimit: 100,
  maxPerUser: 2,
  targeting: { audience: 'new' },
  startsAt: '2026-07-01T00:00:00.000Z',
  expiresAt: '2026-07-31T23:59:59.000Z',
  isActive: true,
  createdAt: '2026-06-01T00:00:00.000Z',
};

const formValues: PromotionFormValues = {
  code: 'WELCOME20',
  name: 'Welcome campaign',
  description: 'New customer offer',
  discountType: 'percent',
  discountValue: 20,
  minOrderVnd: 100_000,
  maxDiscountVnd: 50_000,
  audience: 'new',
  validFrom: new Date('2026-07-01T00:00:00.000Z'),
  validUntil: new Date('2026-07-31T23:59:59.000Z'),
  maxUsage: 100,
  perUserLimit: 2,
  active: true,
};

describe('admin promotion contract mapping', () => {
  it('maps form names to the backend DTO contract', () => {
    expect(toAdminPromotionPayload(formValues)).toEqual({
      code: 'WELCOME20',
      name: 'Welcome campaign',
      description: 'New customer offer',
      type: 'percentage',
      value: 20,
      minOrderAmount: 100_000,
      maxDiscount: 50_000,
      usageLimit: 100,
      maxPerUser: 2,
      targeting: { audience: 'new' },
      startsAt: '2026-07-01T00:00:00.000Z',
      expiresAt: '2026-07-31T23:59:59.000Z',
      isActive: true,
    });
  });

  it('uses the explicit unlimited integer when max usage is omitted', () => {
    expect(toAdminPromotionPayload({ ...formValues, maxUsage: undefined }).usageLimit)
      .toBe(2_147_483_647);
  });

  it.each([
    ['percent', 'percentage'],
    ['fixed', 'fixed'],
    ['shipping', 'free_delivery'],
  ] as const)('maps %s to %s', (discountType, type) => {
    expect(toAdminPromotionPayload({ ...formValues, discountType }).type).toBe(type);
  });

  it('maps API fields back into the edit form', () => {
    expect(toPromotionFormValues(promotion)).toMatchObject({
      code: 'WELCOME20',
      discountType: 'percent',
      minOrderVnd: 100_000,
      audience: 'new',
      perUserLimit: 2,
      maxUsage: 100,
      active: true,
    });
  });
});
