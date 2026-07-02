'use client';

import type { PromotionAudience } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface PromotionTargetSelectorProps {
  value: PromotionAudience;
  onChange: (audience: PromotionAudience) => void;
  minOrderCount?: number;
  onMinOrderCountChange?: (val: number) => void;
}

const AUDIENCES: PromotionAudience[] = ['all', 'new', 'vip', 'lapsed', 'segment', 'order_history'];

export function PromotionTargetSelector({
  value, onChange, minOrderCount, onMinOrderCountChange,
}: PromotionTargetSelectorProps) {
  const t = useTranslations('promotions.audience');
  const tForm = useTranslations('promotions.form');

  return (
    <div className="space-y-3" data-testid="promotion-target-selector">
      <h4 className="text-sm font-semibold text-gray-900">{tForm('targetTitle')}</h4>
      <div className="space-y-2">
        {AUDIENCES.map((aud) => (
          <label
            key={aud}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
              value === aud ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
            )}
          >
            <input
              type="radio"
              name="audience"
              value={aud}
              checked={value === aud}
              onChange={() => onChange(aud)}
              className="h-4 w-4 text-brand-600"
            />
            <span className="text-sm text-gray-900">{t(aud)}</span>
          </label>
        ))}
      </div>

      {value === 'order_history' && (
        <div className="ml-8">
          <label className="label">{tForm('minOrderCount')}</label>
          <input
            type="number"
            value={minOrderCount || ''}
            onChange={(e) => onMinOrderCountChange?.(parseInt(e.target.value, 10) || 0)}
            className="input-field w-24"
            min={1}
          />
        </div>
      )}
    </div>
  );
}
