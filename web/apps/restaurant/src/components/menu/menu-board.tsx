'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/navigation';
import { UtensilsCrossed, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CategoryAccordion } from './category-accordion';
import { api } from '@/lib/api';
import type { MenuItem } from '@/lib/types';

export function MenuBoard() {
  const t = useTranslations('menu');
  const tBoard = useTranslations('menu.board');
  const loadErrorMessage = tBoard('loadError');
  const updateErrorMessage = tBoard('updateError');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.get<MenuItem[]>('/restaurant/menu/items');
      setMenuItems(data);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || loadErrorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [loadErrorMessage]);

  useEffect(() => {
    void fetchMenuItems();
  }, [fetchMenuItems]);

  const handleToggle = async (item: MenuItem) => {
    try {
      const updated = await api.patch<MenuItem>(`/restaurant/menu/items/${item.id}`, {
        available: !item.available,
      });
      setMenuItems((prev) => prev.map((m) => (m.id === item.id ? updated : m)));
    } catch (err) {
      setError((err as { message?: string }).message || updateErrorMessage);
    }
  };

  const handleReorder = (category: string, reordered: MenuItem[]) => {
    setMenuItems((prev) => [
      ...prev.filter((m) => m.category !== category),
      ...reordered,
    ]);
  };

  const categories = Array.from(new Set(menuItems.map((m) => m.category)));
  const groupedItems = categories.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    acc[cat] = menuItems.filter(
      (m) =>
        m.category === cat &&
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl skeleton" />
            <div>
              <div className="h-6 w-32 skeleton mb-1" />
              <div className="h-4 w-20 skeleton" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <UtensilsCrossed className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500">
              {tBoard('summary', { items: menuItems.length, categories: categories.length })}
            </p>
          </div>
        </div>
        <Link href="/menu/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-1.5" />
          {t('addItem')}
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6" role="alert">
          <p className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={() => void fetchMenuItems()} className="mt-3 btn-ghost text-xs text-red-700">
            {tBoard('retry')}
          </button>
        </div>
      )}

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={tBoard('searchPlaceholder')}
          className="input-field pl-10"
        />
      </div>

      {menuItems.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">{tBoard('emptyTitle')}</h3>
          <p className="text-sm text-gray-500 mb-4">{tBoard('emptyDescription')}</p>
          <Link href="/menu/new" className="btn-primary">
            <Plus className="h-4 w-4 mr-1.5" />
            {t('addItem')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, idx) => (
            <CategoryAccordion
              key={cat}
              category={cat}
              items={groupedItems[cat] ?? []}
              onToggle={handleToggle}
              onReorder={handleReorder}
              defaultOpen={idx === 0}
            />
          ))}
          {searchQuery &&
            categories.every((cat) => (groupedItems[cat]?.length ?? 0) === 0) && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">
                  {tBoard('searchEmpty', { query: searchQuery })}
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
