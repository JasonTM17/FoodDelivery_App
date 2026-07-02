'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Archive, CheckSquare, Pause, Play, X } from 'lucide-react';

interface PromotionBulkActionsProps {
  selectedIds: string[];
  onPause?: () => Promise<void>;
  onResume?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onClear?: () => void;
}

export function PromotionBulkActions({
  selectedIds,
  onPause,
  onResume,
  onArchive,
  onClear,
}: PromotionBulkActionsProps) {
  const t = useTranslations('promotions');
  const [loading, setLoading] = useState(false);

  if (selectedIds.length === 0) return null;

  const run = async (action?: () => Promise<void>) => {
    if (!action) return;
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3"
      data-testid="promotion-bulk-actions"
    >
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-brand-600" aria-hidden="true" />
        <span className="text-sm font-medium text-brand-700">
          {t('selectedCount', { count: selectedIds.length })}
        </span>
        <button type="button" onClick={onClear} className="btn-ghost p-0.5" aria-label={t('clearSelection')}>
          <X className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {onPause ? (
          <button type="button" disabled={loading} onClick={() => run(onPause)} className="btn-ghost text-xs">
            <Pause className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t('pause')}
          </button>
        ) : null}
        {onResume ? (
          <button type="button" disabled={loading} onClick={() => run(onResume)} className="btn-ghost text-xs">
            <Play className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t('resume')}
          </button>
        ) : null}
        {onArchive ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => run(onArchive)}
            className="btn-ghost text-xs text-gray-500"
          >
            <Archive className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t('archive')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
