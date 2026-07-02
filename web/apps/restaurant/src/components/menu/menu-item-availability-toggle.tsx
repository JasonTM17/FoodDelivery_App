'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface MenuItemAvailabilityToggleProps {
  mode: 'always' | 'scheduled' | 'hidden';
  onModeChange: (mode: 'always' | 'scheduled' | 'hidden') => void;
  schedule?: { open: string; close: string };
  onScheduleChange?: (schedule: { open: string; close: string }) => void;
}

export function MenuItemAvailabilityToggle({
  mode, onModeChange, schedule, onScheduleChange,
}: MenuItemAvailabilityToggleProps) {
  const t = useTranslations('menu.availability');

  return (
    <div className="space-y-3" data-testid="menu-item-availability-toggle">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>

      <div className="flex gap-2">
        {([
          { value: 'always' as const, label: t('modes.always') },
          { value: 'scheduled' as const, label: t('modes.scheduled') },
          { value: 'hidden' as const, label: t('modes.hidden') },
        ]).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onModeChange(opt.value)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm transition-colors',
              mode === opt.value
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 text-gray-600 hover:border-brand-300'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === 'scheduled' && (
        <div className="flex items-center gap-3 ml-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">{t('from')}</label>
            <input
              type="time"
              value={schedule?.open || ''}
              onChange={(e) => onScheduleChange?.({ open: e.target.value, close: schedule?.close ?? '' })}
              className="input-field w-28 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">{t('to')}</label>
            <input
              type="time"
              value={schedule?.close || ''}
              onChange={(e) => onScheduleChange?.({ open: schedule?.open ?? '', close: e.target.value })}
              className="input-field w-28 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
