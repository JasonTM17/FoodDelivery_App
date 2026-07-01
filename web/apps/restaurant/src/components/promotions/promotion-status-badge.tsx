'use client';

import type { PromotionStatus } from '@/lib/types';
import { getPromotionStatusLabel, getPromotionStatusColor } from '@/lib/promotion-engine';
import { cn } from '@/lib/utils';

interface PromotionStatusBadgeProps {
  status: PromotionStatus;
  className?: string;
}

export function PromotionStatusBadge({ status, className }: PromotionStatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', getPromotionStatusColor(status), className)}>
      {getPromotionStatusLabel(status)}
    </span>
  );
}
