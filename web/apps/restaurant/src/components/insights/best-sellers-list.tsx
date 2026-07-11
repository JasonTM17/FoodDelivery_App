'use client';

import type { BestSeller } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BestSellersListProps {
  items: BestSeller[];
}

export function BestSellersList({ items }: BestSellersListProps) {
  const t = useTranslations('insights.bestSellers');

  return (
    <div className="space-y-3" data-testid="best-sellers-list">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 py-6 text-center">
          <p className="text-sm text-gray-500">{t('empty')}</p>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.itemId} className="flex items-center gap-3">
            <span className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
              idx === 0 ? 'bg-amber-100 text-amber-700' :
              idx === 1 ? 'bg-gray-100 text-gray-600' :
              idx === 2 ? 'bg-orange-50 text-orange-600' :
              'bg-gray-50 text-gray-500'
            )}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">
                {t('metrics', { orders: item.orderCount, revenueShare: item.revenueShare })}
              </p>
            </div>
            <span className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              item.trendVsLastWeek > 0 ? 'text-green-700' :
              item.trendVsLastWeek < 0 ? 'text-red-700' : 'text-gray-600'
            )}>
              {item.trendVsLastWeek > 0 ? <TrendingUp className="h-3 w-3" /> :
               item.trendVsLastWeek < 0 ? <TrendingDown className="h-3 w-3" /> :
               <Minus className="h-3 w-3" />}
              {item.trendVsLastWeek > 0 ? '+' : ''}{item.trendVsLastWeek}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
