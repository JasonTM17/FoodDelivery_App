'use client';

import {
  Clock,
  CheckCircle2,
  CookingPot,
  PackageCheck,
  Bike,
  Home,
  XCircle,
} from 'lucide-react';
import type { OrderStatus } from '@/lib/types';
import { formatTime, cn } from '@/lib/utils';

interface TimelineStep {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
  icon: React.ReactNode;
}

interface StatusTimelineProps {
  currentStatus: OrderStatus;
  statusHistory: Record<string, string>;
}

const STEPS: TimelineStep[] = [
  { status: 'pending', label: 'Chờ xác nhận', timestamp: null, icon: <Clock className="h-4 w-4" /> },
  { status: 'confirmed', label: 'Đã xác nhận', timestamp: null, icon: <CheckCircle2 className="h-4 w-4" /> },
  { status: 'preparing', label: 'Đang chuẩn bị', timestamp: null, icon: <CookingPot className="h-4 w-4" /> },
  { status: 'ready', label: 'Sẵn sàng', timestamp: null, icon: <PackageCheck className="h-4 w-4" /> },
  { status: 'delivering', label: 'Đang giao', timestamp: null, icon: <Bike className="h-4 w-4" /> },
  { status: 'delivered', label: 'Đã giao', timestamp: null, icon: <Home className="h-4 w-4" /> },
];

const CANCELLED = { status: 'cancelled' as OrderStatus, label: 'Đã hủy', timestamp: null, icon: <XCircle className="h-4 w-4" /> };
const REJECTED = { status: 'rejected' as OrderStatus, label: 'Đã từ chối', timestamp: null, icon: <XCircle className="h-4 w-4" /> };

export default function StatusTimeline({ currentStatus, statusHistory }: StatusTimelineProps) {
  const isCancelled = currentStatus === 'cancelled';
  const isRejected = currentStatus === 'rejected';

  if (isCancelled || isRejected) {
    const terminalStatus = isCancelled ? CANCELLED : REJECTED;
    return (
      <div className="space-y-3">
        {STEPS.slice(0, getStepIndex(currentStatus)).map((step, i) => (
          <StepItem key={step.status} step={{ ...step, timestamp: statusHistory[step.status] || null }} index={i} isCompleted={true} />
        ))}
        <div className="relative flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <div className="pt-1.5">
            <p className="text-sm font-medium text-red-600">{terminalStatus.label}</p>
            {statusHistory[currentStatus] && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formatTime(statusHistory[currentStatus])}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = getStepIndex(currentStatus);

  return (
    <div className="space-y-3">
      {STEPS.map((step, i) => {
        const stepWithTime = { ...step, timestamp: statusHistory[step.status] || null };
        return (
          <StepItem
            key={step.status}
            step={stepWithTime}
            index={i}
            isCompleted={i <= currentIdx}
            isCurrent={i === currentIdx}
          />
        );
      })}
    </div>
  );
}

function getStepIndex(status: OrderStatus): number {
  const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'];
  const idx = statusOrder.indexOf(status);
  return idx >= 0 ? idx : 0;
}

function StepItem({
  step,
  index,
  isCompleted,
  isCurrent,
}: {
  step: TimelineStep;
  index: number;
  isCompleted: boolean;
  isCurrent?: boolean;
}) {
  return (
    <div className="relative flex items-start gap-3">
      {/* Connector line */}
      {index < STEPS.length - 1 && (
        <div
          className={cn(
            'absolute left-4 top-8 w-0.5 h-8 -translate-x-1/2',
            isCompleted ? 'bg-brand-500' : 'bg-gray-200'
          )}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full shrink-0 transition-colors',
          isCompleted
            ? 'bg-brand-500 text-white'
            : 'bg-gray-100 text-gray-400',
          isCurrent && 'ring-2 ring-brand-500 ring-offset-2'
        )}
      >
        {step.icon}
      </div>

      {/* Content */}
      <div className="pt-1.5">
        <p
          className={cn(
            'text-sm font-medium',
            isCompleted ? 'text-gray-900' : 'text-gray-400'
          )}
        >
          {step.label}
        </p>
        {step.timestamp && (
          <p className="text-xs text-gray-500 mt-0.5">
            {formatTime(step.timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}
