import { estimateReach } from '@/lib/targeting';
import { api } from '@/lib/api';
import type { PromotionAudience } from '@/lib/types';

export interface TargetingPreview {
  estimatedReach: number;
  audienceLabel: string;
  breakdown?: { label: string; count: number; pct: number }[];
}

export async function previewTargeting(params: {
  audience: PromotionAudience;
  minOrderCount?: number;
  lastOrderWithinDays?: number;
  segmentId?: string;
}): Promise<TargetingPreview> {
  const result = estimateReach({
    audience: params.audience,
    minOrderCount: params.minOrderCount,
  });
  return {
    ...result,
    breakdown: [
      { label: 'Khách mới (30 ngày)', count: Math.round(result.estimatedReach * 0.3), pct: 30 },
      { label: 'Khách quen', count: Math.round(result.estimatedReach * 0.45), pct: 45 },
      { label: 'Khách không hoạt động', count: Math.round(result.estimatedReach * 0.25), pct: 25 },
    ],
  };
}

export async function fetchCustomerSegments(): Promise<{ id: string; name: string; count: number }[]> {
  const data = await api.get<{ segments: { id: string; name: string; count: number }[] }>(
    '/restaurant/customers/segments'
  );
  return data.segments;
}
