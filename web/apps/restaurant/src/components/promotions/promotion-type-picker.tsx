'use client';

import { Percent, DollarSign, Gift, Package } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { PromotionType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PromotionTypePickerProps {
  value: PromotionType;
  onChange: (type: PromotionType) => void;
}

const TYPES: { value: PromotionType; icon: ReactNode }[] = [
  { value: 'percent', icon: <Percent className="h-5 w-5" /> },
  { value: 'fixed', icon: <DollarSign className="h-5 w-5" /> },
  { value: 'bogof', icon: <Gift className="h-5 w-5" /> },
  { value: 'combo', icon: <Package className="h-5 w-5" /> },
];

export function PromotionTypePicker({ value, onChange }: PromotionTypePickerProps) {
  const t = useTranslations('promotions.typePicker');

  return (
    <div className="grid grid-cols-2 gap-3" data-testid="promotion-type-picker">
      {TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={cn(
            'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',
            value === type.value
              ? 'border-brand-500 bg-brand-50 shadow-sm'
              : 'border-gray-200 hover:border-brand-300'
          )}
        >
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            value === type.value ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
          )}>
            {type.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{t(`${type.value}.label`)}</p>
            <p className="text-xs text-gray-500">{t(`${type.value}.description`)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
