'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'danger' | 'secondary';

const STATUS_ACTIONS: Record<string, { label: string; action: string; variant: Variant }[]> = {
  pending: [
    { label: 'Từ chối', action: 'rejected', variant: 'danger' },
    { label: 'Xác nhận', action: 'confirmed', variant: 'primary' },
  ],
  confirmed: [{ label: 'Bắt đầu nấu', action: 'preparing', variant: 'primary' }],
  preparing: [{ label: 'Hoàn thành', action: 'ready', variant: 'primary' }],
};

interface OrderStatusActionsProps {
  orderId: string;
  status: string;
}

export function OrderStatusActions({ orderId, status }: OrderStatusActionsProps) {
  const router = useRouter();
  const actions = STATUS_ACTIONS[status] || [];

  if (actions.length === 0) return null;

  const handleAction = async (newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      router.refresh();
    } catch (err) {
      console.error('Cập nhật trạng thái thất bại:', err);
    }
  };

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
      {actions.map((action) => (
        <button
          key={action.action}
          onClick={(e) => handleAction(action.action, e)}
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
  );
}
