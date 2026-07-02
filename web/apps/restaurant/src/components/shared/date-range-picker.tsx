'use client';

import { useTranslations } from 'next-intl';
import { formatLocalDateInputValue } from '@/lib/utils';

interface DateRangePickerProps {
  value: { start: string; end: string };
  onChange: (range: { start: string; end: string }) => void;
  presets?: { label: string; days: number }[];
}

export function DateRangePicker({
  value, onChange, presets,
}: DateRangePickerProps) {
  const t = useTranslations('shared.dateRange');
  const resolvedPresets = presets ?? [
    { label: t('presets.last7'), days: 7 },
    { label: t('presets.last30'), days: 30 },
    { label: t('presets.last90'), days: 90 },
    { label: t('presets.last365'), days: 365 },
  ];

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - Math.max(days - 1, 0));
    onChange({
      start: formatLocalDateInputValue(start),
      end: formatLocalDateInputValue(end),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="date-range-picker">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          aria-label={t('startDate')}
          max={value.end || undefined}
          className="input-field w-36 text-sm"
        />
        <span className="text-sm text-gray-400" aria-hidden="true">–</span>
        <input
          type="date"
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          aria-label={t('endDate')}
          min={value.start || undefined}
          className="input-field w-36 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-1" aria-label={t('presetsAria')}>
        {resolvedPresets.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => applyPreset(preset.days)}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs hover:border-brand-300 hover:bg-brand-50 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
