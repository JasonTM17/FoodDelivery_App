'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckSquare, X, Eye, EyeOff, Trash2, ArrowUpDown } from 'lucide-react';

interface ItemBulkActionsProps {
  selectedCount: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onToggleAvailability?: (available: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  onMoveToCategory?: (categoryId: string) => Promise<void>;
  categories?: { id: string; name: string }[];
}

export function ItemBulkActions({
  selectedCount, onSelectAll, onDeselectAll,
  onToggleAvailability, onDelete, onMoveToCategory, categories,
}: ItemBulkActionsProps) {
  const t = useTranslations('menu.bulkActions');
  const [loading, setLoading] = useState(false);
  const [showMove, setShowMove] = useState(false);

  if (selectedCount === 0) return null;

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try { await action(); } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-brand-50 border border-brand-200 px-4 py-3" data-testid="item-bulk-actions">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-brand-600" />
        <span className="text-sm font-medium text-brand-700">{t('selectedCount', { count: selectedCount })}</span>
        {onSelectAll && (
          <button type="button" onClick={onSelectAll} className="btn-ghost p-0.5 text-xs text-brand-600">
            {t('selectAll')}
          </button>
        )}
        <button type="button" onClick={onDeselectAll} className="btn-ghost p-0.5">
          <X className="h-3.5 w-3.5 text-brand-500" />
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {onToggleAvailability && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction(() => onToggleAvailability(true))}
              className="btn-ghost text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              {t('show')}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction(() => onToggleAvailability(false))}
              className="btn-ghost text-xs"
            >
              <EyeOff className="h-3.5 w-3.5 mr-1" />
              {t('hide')}
            </button>
          </>
        )}

        {onMoveToCategory && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMove(!showMove)}
              className="btn-ghost text-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              {t('moveCategory')}
            </button>
            {showMove && categories && (
              <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border bg-white shadow-lg z-10 py-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { handleAction(() => onMoveToCategory(cat.id)); setShowMove(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {onDelete && (
          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction(onDelete)}
            className="btn-ghost text-xs text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {t('delete')}
          </button>
        )}
      </div>
    </div>
  );
}
