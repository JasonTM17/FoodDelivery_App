'use client';

import { useRouter } from 'next/navigation';
import { Clock, User, ChevronRight, AlertCircle } from 'lucide-react';
import type { Order } from '@/lib/types';
import { formatCurrency, formatTimeAgo, cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface OrderCardProps {
  order: Order;
}

const STATUS_ACTIONS: Record<string, { label: string; action: string; variant: 'primary' | 'danger' | 'secondary' }[]> = {
  pending: [
    { label: 'Từ chối', action: 'rejected', variant: 'danger' },
    { label: 'Xác nhận', action: 'confirmed', variant: 'primary' },
  ],
  confirmed: [
    { label: 'Bắt đầu nấu', action: 'preparing', variant: 'primary' },
  ],
  preparing: [
    { label: 'Hoàn thành', action: 'ready', variant: 'primary' },
  ],
};

export default function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const isPending = order.status === 'pending';
  const timeAgo = formatTimeAgo(order.createdAt);
  const actions = STATUS_ACTIONS[order.status] || [];

  const handleAction = async (newStatus: string) => {
    try {
      await api.patch(`/orders/${order.id}/status`, { status: newStatus });
      router.refresh();
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  return (
    <div
      className={cn(
        'card hover:shadow-md transition-all cursor-pointer group',
        isPending && 'ring-2 ring-red-200 bg-red-50/30'
      )}
      onClick={() => router.push(`/orders/${order.id}`)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">{order.code}</span>
          {isPending && (
            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <AlertCircle className="h-3 w-3" />
              Mới
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-600 truncate">
              <span className="text-gray-400 mr-1">x{item.quantity}</span>
              {item.name}
            </span>
            <span className="text-gray-500 ml-2 shrink-0">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
        {order.items.length > 4 && (
          <p className="text-xs text-gray-400">+{order.items.length - 4} món khác</p>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between py-2 border-t border-dashed border-gray-200 mb-3">
        <span className="text-sm font-semibold text-gray-900">Tổng cộng</span>
        <span className="text-base font-bold text-brand-600">
          {formatCurrency(order.total)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {order.customerName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </div>
        {order.tableNumber && (
          <span className="font-medium text-gray-700">Bàn {order.tableNumber}</span>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div
          className="flex gap-2 mt-3 pt-3 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action) => (
            <button
              key={action.action}
              onClick={() => handleAction(action.action)}
              className={cn(
                'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                action.variant === 'primary' &&
                  'bg-brand-500 text-white hover:bg-brand-600',
                action.variant === 'danger' &&
                  'bg-red-100 text-red-700 hover:bg-red-200',
                action.variant === 'secondary' &&
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
