'use client';

import { Badge, cn } from '@foodflow/ui';
import { orderStatusMeta } from '@/lib/order-status';

const TONE_CLASS: Record<string, string> = {
  neutral: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  info: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  warning: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  success: 'bg-green-100 text-green-700 hover:bg-green-100',
  danger: 'bg-red-100 text-red-700 hover:bg-red-100',
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = orderStatusMeta(status);
  return (
    <Badge variant="outline" className={cn('border-transparent', TONE_CLASS[meta.tone], className)}>
      {meta.label}
    </Badge>
  );
}
