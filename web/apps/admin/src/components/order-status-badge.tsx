'use client';

import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivering: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

interface OrderStatusBadgeProps {
  status: string;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const normalized = status.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[normalized] || 'bg-gray-100 text-gray-800 border-gray-200'
      )}
    >
      <span
        className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          normalized === 'delivered' && 'bg-green-500',
          normalized === 'cancelled' && 'bg-red-500',
          normalized === 'pending' && 'bg-yellow-500',
          normalized === 'confirmed' && 'bg-blue-500',
          normalized === 'preparing' && 'bg-indigo-500',
          normalized === 'delivering' && 'bg-orange-500'
        )}
      />
      {statusLabels[normalized] || status}
    </span>
  );
}
