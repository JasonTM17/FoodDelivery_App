'use client';

import { Clock, CheckCircle2, CookingPot, PackageCheck, Bike, Home, Ban } from 'lucide-react';
import type { ReactNode } from 'react';
import type { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
}

interface StatusTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: StatusHistoryItem[];
}

const STATUS_ORDER: Array<{ status: OrderStatus; label: string; icon: ReactNode }> = [
  { status: 'restaurant_pending', label: 'Chờ xác nhận', icon: <Clock className="h-4 w-4" /> },
  { status: 'restaurant_accepted', label: 'Đã xác nhận', icon: <CheckCircle2 className="h-4 w-4" /> },
  { status: 'preparing', label: 'Đang chuẩn bị', icon: <CookingPot className="h-4 w-4" /> },
  { status: 'ready_for_pickup', label: 'Sẵn sàng lấy món', icon: <PackageCheck className="h-4 w-4" /> },
  { status: 'delivering', label: 'Đang giao', icon: <Bike className="h-4 w-4" /> },
  { status: 'delivered', label: 'Đã giao', icon: <Home className="h-4 w-4" /> },
];

export default function StatusTimeline({ currentStatus, statusHistory = [] }: StatusTimelineProps) {
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'refunded';
  const currentIndex = STATUS_ORDER.findIndex((item) => item.status === (currentStatus === 'completed' ? 'delivered' : currentStatus));

  return (
    <div className="relative">
      {STATUS_ORDER.map((step, index) => {
        const historyItem = statusHistory.find((item) => item.status === step.status);
        const isCompleted = !isCancelled && currentIndex >= 0 && index <= currentIndex;
        const isCurrent = !isCancelled && index === currentIndex;

        return (
          <div key={step.status} className="flex gap-3 pb-6 last:pb-0">
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              isCompleted ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400',
              isCurrent && 'ring-2 ring-brand-500 ring-offset-2'
            )}>
              {step.icon}
            </div>
            <div>
              <p className={cn('text-sm font-medium', isCompleted ? 'text-gray-900' : 'text-gray-400')}>
                {step.label}
              </p>
              {historyItem && (
                <p className="text-xs text-gray-500">{new Date(historyItem.timestamp).toLocaleString('vi-VN')}</p>
              )}
            </div>
          </div>
        );
      })}

      {isCancelled && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Ban className="h-4 w-4" />
          </div>
          <p className="pt-1.5 text-sm font-medium text-red-600">
            {currentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Đã huỷ'}
          </p>
        </div>
      )}
    </div>
  );
}
