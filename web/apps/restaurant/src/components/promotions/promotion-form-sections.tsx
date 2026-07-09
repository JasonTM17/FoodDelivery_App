'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Dispatch, SetStateAction } from 'react';
import { api } from '@/lib/api';
import type { MenuCategory } from '@/lib/types';
import { PromotionItemSelector } from './promotion-item-selector';

interface PromotionApplyScopeSectionProps {
  appliesTo: 'all' | 'category' | 'items';
  setAppliesTo: Dispatch<SetStateAction<'all' | 'category' | 'items'>>;
  categoryId: string;
  setCategoryId: (categoryId: string) => void;
  itemIds: string[];
  setItemIds: (itemIds: string[]) => void;
}

export function PromotionApplyScopeSection({
  appliesTo,
  setAppliesTo,
  categoryId,
  setCategoryId,
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
      {appliesTo === 'category' && (
        <PromotionCategorySelector value={categoryId} onChange={setCategoryId} />
      )}
      {appliesTo === 'items' && (
        <PromotionItemSelector value={itemIds} onChange={setItemIds} />
      )}
    </section>
  );
}

interface PromotionCategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
}

function PromotionCategorySelector({ value, onChange }: PromotionCategorySelectorProps) {
  const t = useTranslations('promotions.categorySelector');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<MenuCategory[]>('/restaurant/menu/categories');
      setCategories(flattenVisibleCategories(data));
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  if (loading) {
    return <div className="h-10 rounded bg-gray-100 animate-pulse" aria-label={t('loading')} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => void loadCategories()} className="mt-2 btn-ghost text-xs text-red-700">
          {t('retry')}
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{t('empty')}</p>;
  }

  return (
    <div>
      <label className="label" htmlFor="promotion-category-selector">{t('label')}</label>
      <select
        id="promotion-category-selector"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="select-field"
        required
      >
        <option value="">{t('placeholder')}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
    </div>
  );
}

function flattenVisibleCategories(categories: MenuCategory[]): MenuCategory[] {
  return categories.flatMap((category) => {
    const current = category.isVisible ? [category] : [];
    const children = category.children ? flattenVisibleCategories(category.children) : [];
    return [...current, ...children];
  });
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
