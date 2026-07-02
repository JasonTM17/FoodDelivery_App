'use client';

import type { PromotionStatus } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { getPromotionStatusColor } from '@/lib/promotion-engine';
import { cn } from '@/lib/utils';

interface PromotionStatusBadgeProps {
  status: PromotionStatus;
  className?: string;
}

export function PromotionStatusBadge({ status, className }: PromotionStatusBadgeProps) {
  const t = useTranslations('promotions.status');

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', getPromotionStatusColor(status), className)}>
      {t(status)}
    </span>
  );
}
