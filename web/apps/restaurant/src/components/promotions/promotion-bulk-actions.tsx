'use client';

import { useState } from 'react';
import { CheckSquare, X, Pause, Play, Archive } from 'lucide-react';

interface PromotionBulkActionsProps {
  selectedIds: string[];
  onPause?: () => Promise<void>;
  onResume?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onToggleAll?: () => void;
  onClear?: () => void;
}

export function PromotionBulkActions({
  selectedIds, onPause, onResume, onArchive, onToggleAll, onClear,
}: PromotionBulkActionsProps) {
  const [loading, setLoading] = useState(false);

  if (selectedIds.length === 0) return null;

  const run = async (action?: () => Promise<void>) => {
    if (!action) return;
    setLoading(true);
    try { await action(); } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-brand-50 border border-brand-200 px-4 py-3" data-testid="promotion-bulk-actions">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-brand-600" />
        <span className="text-sm font-medium text-brand-700">Đã chọn {selectedIds.length}</span>
        <button type="button" onClick={onClear} className="btn-ghost p-0.5">
          <X className="h-3.5 w-3.5 text-brand-500" />
        </button>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {onPause && (
          <button type="button" disabled={loading} onClick={() => run(onPause)} className="btn-ghost text-xs">
            <Pause className="h-3.5 w-3.5 mr-1" />
            Tạm dừng
          </button>
        )}
        {onResume && (
          <button type="button" disabled={loading} onClick={() => run(onResume)} className="btn-ghost text-xs">
            <Play className="h-3.5 w-3.5 mr-1" />
            Kích hoạt
          </button>
        )}
        {onArchive && (
          <button type="button" disabled={loading} onClick={() => run(onArchive)} className="btn-ghost text-xs text-gray-500">
            <Archive className="h-3.5 w-3.5 mr-1" />
            Lưu trữ
          </button>
        )}
      </div>
    </div>
  );
}
