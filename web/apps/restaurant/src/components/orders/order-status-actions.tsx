'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'danger' | 'secondary';

const STATUS_ACTIONS: Record<string, { labelKey: string; action: string; variant: Variant }[]> = {
  restaurant_pending: [
    { labelKey: 'reject', action: 'cancelled', variant: 'danger' },
    { labelKey: 'confirm', action: 'restaurant_accepted', variant: 'primary' },
  ],
  restaurant_accepted: [{ labelKey: 'startCooking', action: 'preparing', variant: 'primary' }],
  preparing: [{ labelKey: 'complete', action: 'ready_for_pickup', variant: 'primary' }],
};

interface OrderStatusActionsProps {
  orderId: string;
  status: string;
}

export function OrderStatusActions({ orderId, status }: OrderStatusActionsProps) {
  const router = useRouter();
  const t = useTranslations('orders.statusActions');
  const [error, setError] = useState('');
  const actions = STATUS_ACTIONS[status] || [];

  if (actions.length === 0) return null;

  const handleAction = async (newStatus: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setError('');
    try {
      await api.patch(`/restaurant/orders/${orderId}/status`, { status: newStatus });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('updateError'));
    }
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex gap-2">
        {actions.map((action) => (
          <button
            key={action.action}
            type="button"
            onClick={(event) => void handleAction(action.action, event)}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              action.variant === 'primary' && 'bg-brand-500 text-white hover:bg-brand-600',
              action.variant === 'danger' && 'bg-red-100 text-red-700 hover:bg-red-200',
              action.variant === 'secondary' && 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
          >
            {t(action.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
