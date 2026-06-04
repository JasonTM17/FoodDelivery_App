'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Plus, Search, ToggleLeft, ToggleRight, ImageOff } from 'lucide-react';
import { api } from '@/lib/api';
import type { MenuItem } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await api.get<MenuItem[]>('/menu');
        setMenuItems(data);
      } catch (err: unknown) {
        const apiError = err as { message?: string };
        setError(apiError.message || 'Không thể tải thực đơn');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const categories = ['all', ...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updated = await api.put<MenuItem>(`/menu/${item.id}`, {
        ...item,
        available: !item.available,
      });
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? updated : m))
      );
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

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
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-20 skeleton rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card space-y-3">
              <div className="h-40 w-full skeleton rounded-lg" />
              <div className="h-5 w-3/4 skeleton" />
              <div className="h-4 w-1/2 skeleton" />
              <div className="h-5 w-20 skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <UtensilsCrossed className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Thực đơn</h1>
            <p className="text-sm text-gray-500">
              {menuItems.length} món ăn
            </p>
          </div>
        </div>
        <Link href="/menu/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-1.5" />
          Thêm món
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm món ăn..."
          className="input-field pl-10"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeCategory === cat
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {cat === 'all' ? 'Tất cả' : cat}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Chưa có món ăn</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery ? 'Không tìm thấy món phù hợp' : 'Thêm món ăn đầu tiên vào thực đơn'}
          </p>
          {!searchQuery && (
            <Link href="/menu/new" className="btn-primary">
              <Plus className="h-4 w-4 mr-1.5" />
              Thêm món
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                'card overflow-hidden hover:shadow-md transition-all group',
                !item.available && 'opacity-60'
              )}
            >
              {/* Image */}
              <div className="relative h-40 -mx-4 -mt-4 mb-4 overflow-hidden bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="h-8 w-8 text-gray-300" />
                  </div>
                )}
                <div className="fallback hidden w-full h-full flex items-center justify-center bg-gray-100">
                  <ImageOff className="h-8 w-8 text-gray-300" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className={cn(
                    'badge text-xs',
                    item.available
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-red-100 text-red-700 border-red-200'
                  )}>
                    {item.available ? 'Còn' : 'Hết'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                  {item.description || 'Chưa có mô tả'}
                </p>
              </div>

              {/* Category + Price */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {item.category}
                </span>
                <span className="text-base font-bold text-brand-600">
                  {formatCurrency(item.price)}
                </span>
              </div>

              {/* Toggle availability */}
              <button
                onClick={() => handleToggleAvailability(item)}
                className="flex items-center gap-2 w-full justify-center py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {item.available ? (
                  <>
                    <ToggleRight className="h-4 w-4 text-green-500" />
                    <span>Đang bán</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4 text-red-500" />
                    <span>Tạm ngưng</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
