import type { PromotionFormValues } from '@/lib/schemas/promotion-schema';

export type AdminPromotionType = 'percentage' | 'fixed' | 'free_delivery';

export interface AdminPromotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: AdminPromotionType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageCount: number;
  usageLimit: number;
  maxPerUser: number | null;
  targeting: { audience?: string; segmentId?: string } | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminPromotionPayload {
  code: string;
  name: string;
  description?: string;
  type: AdminPromotionType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  maxPerUser: number;
  targeting: { audience: string; segmentId?: string };
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

const MAX_UNLIMITED_USAGE = 2_147_483_647;

export function toAdminPromotionPayload(values: PromotionFormValues): AdminPromotionPayload {
  const typeMap: Record<PromotionFormValues['discountType'], AdminPromotionType> = {
    percent: 'percentage',
    fixed: 'fixed',
    shipping: 'free_delivery',
  };

  return {
    code: values.code,
    name: values.name,
    description: values.description || undefined,
    type: typeMap[values.discountType],
    value: values.discountValue,
    minOrderAmount: values.minOrderVnd ?? 0,
    maxDiscount: values.maxDiscountVnd || undefined,
    usageLimit: values.maxUsage ?? MAX_UNLIMITED_USAGE,
    maxPerUser: values.perUserLimit,
    targeting: {
      audience: values.audience,
      ...(values.segmentId ? { segmentId: values.segmentId } : {}),
    },
    startsAt: values.validFrom.toISOString(),
    expiresAt: values.validUntil.toISOString(),
    isActive: values.active,
  };
}

export function toPromotionFormValues(promotion: AdminPromotion): Partial<PromotionFormValues> {
  const typeMap: Record<AdminPromotionType, PromotionFormValues['discountType']> = {
    percentage: 'percent',
    fixed: 'fixed',
    free_delivery: 'shipping',
  };

  return {
    code: promotion.code,
    name: promotion.name,
    description: promotion.description ?? '',
    discountType: typeMap[promotion.type],
    discountValue: promotion.value,
    minOrderVnd: promotion.minOrderAmount,
    maxDiscountVnd: promotion.maxDiscount ?? undefined,
    audience: (promotion.targeting?.audience as PromotionFormValues['audience']) ?? 'all',
    segmentId: promotion.targeting?.segmentId,
    perUserLimit: promotion.maxPerUser ?? 1,
    maxUsage: promotion.usageLimit === MAX_UNLIMITED_USAGE ? undefined : promotion.usageLimit,
    validFrom: new Date(promotion.startsAt),
    validUntil: new Date(promotion.expiresAt),
    active: promotion.isActive,
  };
}
