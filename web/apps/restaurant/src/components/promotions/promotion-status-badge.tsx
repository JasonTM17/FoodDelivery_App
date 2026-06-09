'use client';

import { cn } from '@/lib/utils';
import { getPromotionStatus, daysUntilExpiry } from '@/lib/promotion-engine';

interface PromotionStatusBadgeProps {
  active: boolean;
  startDate: string;
  endDate: string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Sắp diễn ra', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  active: { label: 'Đang chạy', className: 'bg-green-100 text-green-700 border-green-200' },
  expired: { label: 'Đã hết hạn', className: 'bg-red-100 text-red-700 border-red-200' },
  draft: { label: 'Tạm dừng', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export function PromotionStatusBadge({ active, startDate, endDate, className }: PromotionStatusBadgeProps) {
  const status = getPromotionStatus(startDate, endDate, active);
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const daysLeft = daysUntilExpiry(endDate);

  return (
    <span className={cn('badge text-xs', config.className, className)}>
      {config.label}
      {status === 'active' && daysLeft <= 7 && daysLeft > 0 && (
        <span className="ml-1 opacity-70">({daysLeft} ngày)</span>
      )}
    </span>
  );
}
