'use client';

import { Clock, CheckCircle2, CookingPot, PackageCheck, Bike, Home, Ban } from 'lucide-react';
import type { OrderStatus } from '@/lib/types';
import { cn, formatTime } from '@/lib/utils';

interface TimelineStep {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
  actor?: string;
  note?: string;
}

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  steps: TimelineStep[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  restaurant_pending: <Clock className="h-4 w-4" />,
  restaurant_accepted: <CheckCircle2 className="h-4 w-4" />,
  preparing: <CookingPot className="h-4 w-4" />,
  ready_for_pickup: <PackageCheck className="h-4 w-4" />,
  delivering: <Bike className="h-4 w-4" />,
  delivered: <Home className="h-4 w-4" />,
  completed: <Home className="h-4 w-4" />,
  cancelled: <Ban className="h-4 w-4" />,
};

const STATUS_ORDER: OrderStatus[] = [
  'restaurant_pending',
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'delivering',
  'delivered',
];

const STATUS_LABELS: Record<string, string> = {
  restaurant_pending: 'Chờ xác nhận',
  restaurant_accepted: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  ready_for_pickup: 'Sẵn sàng lấy món',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã huỷ',
};

export function OrderTimeline({ currentStatus, steps }: OrderTimelineProps) {
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'refunded';
  const normalizedCurrent = currentStatus === 'completed' ? 'delivered' : currentStatus;
  const currentIdx = STATUS_ORDER.indexOf(normalizedCurrent);

  return (
    <div className="relative space-y-0" data-testid="order-timeline">
      {STATUS_ORDER.map((status, index) => {
        const step = steps.find((item) => item.status === status);
        const isCompleted = currentIdx >= 0 && index <= currentIdx && !isCancelled;
        const isCurrent = index === currentIdx && !isCancelled;
        const isLast = index === STATUS_ORDER.length - 1;

        return (
          <div key={status} className="relative flex items-start gap-3 pb-0">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-4 top-8 w-0.5 -translate-x-1/2',
                  isCompleted ? 'h-10 bg-brand-500' : 'h-10 bg-gray-200'
                )}
                style={{ height: 'calc(100% - 2rem)' }}
              />
            )}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                isCompleted ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400',
                isCurrent && 'ring-2 ring-brand-500 ring-offset-2',
                isCancelled && 'opacity-40'
              )}
            >
              {ICON_MAP[status]}
            </div>
            <div className="pt-1.5 pb-6 min-w-0 flex-1">
              <p className={cn('text-sm font-medium', isCompleted ? 'text-gray-900' : 'text-gray-400')}>
                {step?.label || STATUS_LABELS[status]}
              </p>
              {step?.timestamp && (
                <p className="text-xs text-gray-500 mt-0.5">{formatTime(step.timestamp)}</p>
              )}
              {step?.actor && <p className="text-xs text-gray-400 mt-0.5">{step.actor}</p>}
              {step?.note && <p className="text-xs text-gray-500 mt-0.5 italic">{step.note}</p>}
            </div>
          </div>
        );
      })}

      {isCancelled && (
        <div className="relative flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Ban className="h-4 w-4 text-red-600" />
          </div>
          <div className="pt-1.5">
            <p className="text-sm font-medium text-red-600">
              {currentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Đã huỷ'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
