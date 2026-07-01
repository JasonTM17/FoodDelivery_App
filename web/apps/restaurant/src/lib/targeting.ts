import type { PromotionTarget } from './types';

export interface TargetingEstimate {
  estimatedReach: number;
  audienceLabel: string;
}

export function estimateReach(target: PromotionTarget): TargetingEstimate {
  const baseReach = 1250; // mock base
  let multiplier = 1;
  let audienceLabel = '';

  switch (target.audience) {
    case 'all':
      multiplier = 1;
      audienceLabel = 'Tất cả khách hàng';
      break;
    case 'new':
      multiplier = 0.3;
      audienceLabel = 'Khách mới (30 ngày)';
      break;
    case 'vip':
      multiplier = 0.12;
      audienceLabel = 'Khách VIP';
      break;
    case 'lapsed':
      multiplier = 0.25;
      audienceLabel = 'Không hoạt động 30+ ngày';
      break;
    case 'segment':
      multiplier = 0.2;
      audienceLabel = 'Phân khúc tuỳ chọn';
      break;
    case 'order_history':
      multiplier = target.minOrderCount && target.minOrderCount >= 10 ? 0.15 : 0.4;
      audienceLabel = target.minOrderCount && target.minOrderCount >= 10
        ? 'Khách hàng trung thành'
        : 'Khách hàng thường xuyên';
      break;
  }

  return {
    estimatedReach: Math.round(baseReach * multiplier),
    audienceLabel,
  };
}
