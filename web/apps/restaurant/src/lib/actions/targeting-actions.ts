import { api } from '@/lib/api';
import type { PromotionAudience } from '@/lib/types';

export interface TargetingPreview {
  audience: PromotionAudience;
  estimatedReach: number;
  breakdown: { key: 'new' | 'returning' | 'lapsed'; count: number; pct: number }[];
  updatedAt: string;
}

export async function previewTargeting(params: {
  audience: PromotionAudience;
  minOrderCount?: number;
  lastOrderWithinDays?: number;
  segmentId?: string;
}): Promise<TargetingPreview> {
  return api.get<TargetingPreview>('/restaurant/promotions/targeting-preview', {
    params: {
      audience: params.audience,
      minOrderCount: params.minOrderCount,
      lastOrderWithinDays: params.lastOrderWithinDays,
      segmentId: params.segmentId,
    },
  });
}
