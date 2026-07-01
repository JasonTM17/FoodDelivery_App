'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'danger' | 'secondary';

const STATUS_ACTIONS: Record<string, { label: string; action: string; variant: Variant }[]> = {
  restaurant_pending: [
    { label: 'Từ chối', action: 'cancelled', variant: 'danger' },
    { label: 'Xác nhận', action: 'restaurant_accepted', variant: 'primary' },
  ],
  restaurant_accepted: [{ label: 'Bắt đầu nấu', action: 'preparing', variant: 'primary' }],
  preparing: [{ label: 'Hoàn thành', action: 'ready_for_pickup', variant: 'primary' }],
};

interface OrderStatusActionsProps {
  orderId: string;
  status: string;
}

export function OrderStatusActions({ orderId, status }: OrderStatusActionsProps) {
  const router = useRouter();
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
      setError(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại');
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
            onClick={(event) => handleAction(action.action, event)}
            className={cn(
              'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              action.variant === 'primary' && 'bg-brand-500 text-white hover:bg-brand-600',
              action.variant === 'danger' && 'bg-red-100 text-red-700 hover:bg-red-200',
              action.variant === 'secondary' && 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
