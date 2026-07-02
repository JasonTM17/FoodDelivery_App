'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, PackageCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { OrderStatus } from '@/lib/types';

interface OrderActionsProps {
  status: OrderStatus;
  onStatusChange: (newStatus: OrderStatus, reason?: string) => Promise<void>;
  isSubmitting?: boolean;
}

const ACTION_CONFIG: Record<string, { labelKey: string; nextStatus: OrderStatus; icon: React.ReactNode; requiresReason: boolean; reasonKey?: string }[]> = {
  restaurant_pending: [
    { labelKey: 'accept', nextStatus: 'restaurant_accepted', icon: <CheckCircle2 className="h-4 w-4" />, requiresReason: false },
    { labelKey: 'reject', nextStatus: 'cancelled', icon: <XCircle className="h-4 w-4" />, requiresReason: true, reasonKey: 'rejectReason' },
  ],
  restaurant_accepted: [
    { labelKey: 'startPreparing', nextStatus: 'preparing', icon: <PackageCheck className="h-4 w-4" />, requiresReason: false },
  ],
  preparing: [
    { labelKey: 'readyForPickup', nextStatus: 'ready_for_pickup', icon: <PackageCheck className="h-4 w-4" />, requiresReason: false },
  ],
};

export function OrderActions({ status, onStatusChange, isSubmitting }: OrderActionsProps) {
  const t = useTranslations('orderDetail.actions');
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
      setActionError(err instanceof Error ? err.message : t('actionFailed'));
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="order-actions">
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.nextStatus}
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleAction(action.nextStatus, action.requiresReason)}
            className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {action.icon}
            {t(action.labelKey)}
          </button>
        ))}
      </div>

      {showReasonInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t(actions.find((action) => action.nextStatus === showReasonInput)?.reasonKey ?? 'reason')}
            className="input-field flex-1 text-sm"
          />
          <button
            type="button"
            disabled={isSubmitting || !reason.trim()}
            onClick={() => void handleAction(showReasonInput, true)}
            className="btn-primary text-xs disabled:opacity-50"
          >
            {t('confirm')}
          </button>
          <button
            type="button"
            onClick={() => { setShowReasonInput(null); setReason(''); }}
            className="btn-ghost text-xs"
          >
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  );
}
