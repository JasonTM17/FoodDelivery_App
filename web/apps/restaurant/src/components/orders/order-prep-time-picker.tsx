'use client';

import { useState } from 'react';
import { Clock, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface OrderPrepTimePickerProps {
  onSelect: (minutes: number) => void;
  selected?: number;
}

const PRESETS = [5, 10, 15, 20, 30, 45];

export function OrderPrepTimePicker({ onSelect, selected }: OrderPrepTimePickerProps) {
  const t = useTranslations('orderDetail.prepTime');
  const [customMin, setCustomMin] = useState('');

  const handleCustom = () => {
    const val = parseInt(customMin, 10);
    if (val > 0 && val <= 120) {
      onSelect(val);
      setCustomMin('');
    }
  };

  return (
    <div className="space-y-3" data-testid="order-prep-time-picker">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
        <Clock className="h-4 w-4 text-brand-600" />
        {t('title')}
      </h4>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((min) => (
          <button
            key={min}
            type="button"
            onClick={() => onSelect(min)}
            className={cn(
              'flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors',
              selected === min
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 text-gray-700 hover:border-brand-300',
            )}
          >
            {selected === min && <Check className="h-3.5 w-3.5" />}
            {t('minutes', { minutes: min })}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={customMin}
          onChange={(event) => setCustomMin(event.target.value)}
          placeholder={t('customPlaceholder')}
          className="input-field flex-1 text-sm"
          min={1}
          max={120}
          onKeyDown={(event) => event.key === 'Enter' && handleCustom()}
        />
        <button
          type="button"
          onClick={handleCustom}
          className="btn-secondary text-xs"
          disabled={!customMin}
        >
          {t('set')}
        </button>
      </div>
    </div>
  );
}
