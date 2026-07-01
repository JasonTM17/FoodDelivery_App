'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, PackageCheck } from 'lucide-react';
import type { OrderStatus } from '@/lib/types';

interface OrderActionsProps {
  status: OrderStatus;
  onStatusChange: (newStatus: OrderStatus, reason?: string) => Promise<void>;
  isSubmitting?: boolean;
}

const ACTION_CONFIG: Record<string, { label: string; nextStatus: OrderStatus; icon: React.ReactNode; requiresReason: boolean; reasonLabel?: string }[]> = {
  restaurant_pending: [
    { label: 'Chấp nhận', nextStatus: 'restaurant_accepted', icon: <CheckCircle2 className="h-4 w-4" />, requiresReason: false },
    { label: 'Từ chối', nextStatus: 'cancelled', icon: <XCircle className="h-4 w-4" />, requiresReason: true, reasonLabel: 'Lý do từ chối' },
  ],
  restaurant_accepted: [
    { label: 'Bắt đầu chuẩn bị', nextStatus: 'preparing', icon: <PackageCheck className="h-4 w-4" />, requiresReason: false },
  ],
  preparing: [
    { label: 'Sẵn sàng lấy món', nextStatus: 'ready_for_pickup', icon: <PackageCheck className="h-4 w-4" />, requiresReason: false },
  ],
};

export function OrderActions({ status, onStatusChange, isSubmitting }: OrderActionsProps) {
  const [showReasonInput, setShowReasonInput] = useState<OrderStatus | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');

  const actions = ACTION_CONFIG[status] || [];

  const handleAction = async (nextStatus: OrderStatus, requiresReason: boolean) => {
    setActionError('');
    if (requiresReason && !showReasonInput) {
      setShowReasonInput(nextStatus);
      return;
    }
    try {
      await onStatusChange(nextStatus, requiresReason ? reason : undefined);
      setReason('');
      setShowReasonInput(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Thao tác thất bại');
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="order-actions">
      {actionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.nextStatus}
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction(action.nextStatus, action.requiresReason)}
            className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {showReasonInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={actions.find((action) => action.nextStatus === showReasonInput)?.reasonLabel || 'Lý do'}
            className="input-field flex-1 text-sm"
          />
          <button
            type="button"
            disabled={isSubmitting || !reason.trim()}
            onClick={() => handleAction(showReasonInput, true)}
            className="btn-primary text-xs disabled:opacity-50"
          >
            Xác nhận
          </button>
          <button
            type="button"
            onClick={() => { setShowReasonInput(null); setReason(''); }}
            className="btn-ghost text-xs"
          >
            Huỷ
          </button>
        </div>
      )}
    </div>
  );
}
