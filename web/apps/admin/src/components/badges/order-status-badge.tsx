'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  restaurant_pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  restaurant_accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ready_for_pickup: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  driver_assigned: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  delivering: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const knownStatusKeys = new Set(Object.keys(statusStyles));

const dotColors: Record<string, string> = {
  delivered: 'bg-green-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  pending: 'bg-yellow-500',
  restaurant_pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  restaurant_accepted: 'bg-blue-500',
  preparing: 'bg-indigo-500',
  ready_for_pickup: 'bg-emerald-500',
  driver_assigned: 'bg-cyan-500',
  delivering: 'bg-orange-500',
};

interface OrderStatusBadgeProps {
  status: string;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const t = useTranslations('orders.statuses');
  const normalized = status.toLowerCase();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[normalized] || 'bg-muted text-muted-foreground border-border'
      )}
    >
      <span
        className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          dotColors[normalized] || 'bg-muted-foreground'
        )}
      />
      {knownStatusKeys.has(normalized) ? t(normalized) : status}
    </span>
  );
}
