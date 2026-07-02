import { describe, expect, it } from 'vitest';
import {
  createEmptyPromotionForm,
  promotionToFormData,
  toPromotionPayload,
  type AdminPromotion,
} from '@/components/promotions/admin-promotions-types';

const promotion: AdminPromotion = {
  id: 'promotion-1',
  code: 'WELCOME20',
  type: 'percentage',
  value: 20,
  minOrder: 100_000,
  maxDiscount: 50_000,
  usageCount: 10,
  usageLimit: 100,
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: '2026-07-31T23:59:59.000Z',
  active: true,
  description: 'Welcome campaign',
};

describe('admin promotion form mapping', () => {
  it('creates an empty percentage form', () => {
    expect(createEmptyPromotionForm()).toMatchObject({
      code: '',
      type: 'percentage',
      active: true,
    });
  });

  it('maps API dates and amounts into editable strings', () => {
    expect(promotionToFormData(promotion)).toMatchObject({
      code: 'WELCOME20',
      value: '20',
      minOrder: '100000',
      maxDiscount: '50000',
      usageLimit: '100',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
  });

  it('maps optional zero values to empty inputs', () => {
    expect(promotionToFormData({
      ...promotion,
      minOrder: 0,
      maxDiscount: 0,
      usageLimit: 0,
    })).toMatchObject({ minOrder: '', maxDiscount: '', usageLimit: '' });
  });

  it('normalizes form values for the API contract', () => {
    expect(toPromotionPayload({
      ...createEmptyPromotionForm(),
      code: 'FIXED50',
      type: 'fixed',
      value: '50000',
    })).toMatchObject({
      code: 'FIXED50',
      type: 'fixed',
      value: 50_000,
      minOrder: 0,
      startDate: null,
      endDate: null,
    });
  });
});
