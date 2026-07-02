'use client';

import { useTranslations } from 'next-intl';
import type { Dispatch, SetStateAction } from 'react';
import { PromotionItemSelector } from './promotion-item-selector';

interface PromotionApplyScopeSectionProps {
  appliesTo: 'all' | 'category' | 'items';
  setAppliesTo: Dispatch<SetStateAction<'all' | 'category' | 'items'>>;
  itemIds: string[];
  setItemIds: (itemIds: string[]) => void;
}

export function PromotionApplyScopeSection({
  appliesTo,
  setAppliesTo,
  itemIds,
  setItemIds,
}: PromotionApplyScopeSectionProps) {
  const t = useTranslations('promotions.form');

  return (
    <section className="card space-y-4">
      <h2 className="text-base font-semibold text-gray-900">{t('appliesToTitle')}</h2>
      <div className="flex gap-2">
        {(['all', 'category', 'items'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setAppliesTo(option)}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
              appliesTo === option ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'
            }`}
          >
            {t(`appliesTo.${option}`)}
          </button>
        ))}
      </div>
      {appliesTo === 'items' && (
        <PromotionItemSelector value={itemIds} onChange={setItemIds} />
      )}
    </section>
  );
}

interface PromotionLimitsSectionProps {
  maxUsage: string;
  setMaxUsage: (value: string) => void;
  perUserLimit: string;
  setPerUserLimit: (value: string) => void;
  stackable: boolean;
  setStackable: (value: boolean) => void;
}

export function PromotionLimitsSection({
  maxUsage,
  setMaxUsage,
  perUserLimit,
  setPerUserLimit,
  stackable,
  setStackable,
}: PromotionLimitsSectionProps) {
  const t = useTranslations('promotions.form');

  return (
    <section className="card space-y-4">
      <h2 className="text-base font-semibold text-gray-900">{t('limitsTitle')}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('maxUsage')}</label>
          <input
            type="number"
            value={maxUsage}
            onChange={(event) => setMaxUsage(event.target.value)}
            className="input-field"
            placeholder={t('unlimited')}
            min={1}
          />
        </div>
        <div>
          <label className="label">{t('perUserLimit')}</label>
          <input
            type="number"
            value={perUserLimit}
            onChange={(event) => setPerUserLimit(event.target.value)}
            className="input-field"
            min={1}
          />
        </div>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={stackable} onChange={(event) => setStackable(event.target.checked)} className="rounded border-gray-300" />
        <span className="text-sm text-gray-700">{t('stackable')}</span>
      </label>
    </section>
  );
}
