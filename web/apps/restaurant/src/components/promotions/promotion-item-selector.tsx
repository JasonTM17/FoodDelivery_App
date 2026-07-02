'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/lib/types';

interface PromotionItemSelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function PromotionItemSelector({ value, onChange }: PromotionItemSelectorProps) {
  const t = useTranslations('promotions.itemSelector');
  const loadErrorMessage = t('loadError');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<MenuItem[]>('/restaurant/menu/items');
      setItems(data);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || loadErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadErrorMessage]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filtered = items.filter((item) =>
    !search || item.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(next);
  };

  return (
    <div data-testid="promotion-item-selector">
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="input-field pl-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-gray-100 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void loadItems()} className="mt-2 btn-ghost text-xs text-red-700">
            {t('retry')}
          </button>
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg">
          {filtered.map((item) => {
            const selected = value.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                  selected ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <span>{item.name}</span>
                {selected ? (
                  <Check className="h-4 w-4 text-brand-600" />
                ) : (
                  <span className="text-xs text-gray-400">{formatCurrency(item.price ?? 0)}</span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-gray-400">{t('empty')}</p>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((id) => {
            const item = items.find((i) => i.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
                {item?.name || id}
                <button type="button" onClick={() => toggle(id)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
