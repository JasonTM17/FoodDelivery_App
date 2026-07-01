'use client';

import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value: { start: string; end: string };
  onChange: (range: { start: string; end: string }) => void;
  presets?: { label: string; days: number }[];
}

const DEFAULT_PRESETS = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
  { label: 'Năm nay', days: 365 },
];

export function DateRangePicker({
  value, onChange, presets = DEFAULT_PRESETS,
}: DateRangePickerProps) {
  const applyPreset = (days: number) => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    onChange({ start, end });
  };

  return (
    <div className="flex items-center gap-3" data-testid="date-range-picker">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className="input-field w-36 text-sm"
        />
        <span className="text-sm text-gray-400">-</span>
        <input
          type="date"
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className="input-field w-36 text-sm"
        />
      </div>
      <div className="flex gap-1">
        {presets.map((preset) => (
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
