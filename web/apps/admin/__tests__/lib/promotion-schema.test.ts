import { describe, expect, it } from 'vitest';
import { createPromotionSchema } from '@/lib/schemas/promotion-schema';

const schema = createPromotionSchema(key => `translated:${key}`);

const validPromotion = {
  code: 'WELCOME20',
  name: 'Welcome offer',
  discountType: 'percent' as const,
  discountValue: 20,
  minOrderVnd: 0,
  maxDiscountVnd: '',
  audience: 'all' as const,
  validFrom: '2026-07-01',
  validUntil: '2026-07-31',
  maxUsage: '',
  perUserLimit: 1,
  description: '',
  active: true,
};

describe('admin promotion schema', () => {
  it('treats blank optional numeric inputs as omitted', () => {
    const result = schema.parse(validPromotion);

    expect(result.maxDiscountVnd).toBeUndefined();
    expect(result.maxUsage).toBeUndefined();
  });

  it('uses the locale-provided validation message', () => {
    const result = schema.safeParse({ ...validPromotion, code: 'ab' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('translated:codeMin');
    }
  });

  it('rejects a schedule whose end is not after its start', () => {
    const result = schema.safeParse({
      ...validPromotion,
      validFrom: '2026-07-31',
      validUntil: '2026-07-01',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ['validUntil'],
        message: 'translated:dateOrder',
      }));
    }
  });
});
