'use client';

import { formatCurrency, cn } from '@/lib/utils';
import { BarChart3, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface BenchmarkOverlayProps {
  restaurant: { avgOrderValue: number; repeatRate: number };
  industry: { avgOrderValue: number; repeatRate: number };
  cohortSize: number;
  source: 'cohort' | 'platform';
  updatedAt?: string;
}

export function BenchmarkOverlay({
  restaurant,
  industry,
  cohortSize,
  source,
  updatedAt,
}: BenchmarkOverlayProps) {
  const locale = useLocale();
  const t = useTranslations('revenue.benchmark');
  const updatedLabel = formatUpdatedAt(updatedAt, locale);

  return (
    <div className="card space-y-4" data-testid="benchmark-overlay">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-brand-600" />
          {t('title')}
        </h4>
        {updatedLabel && (
          <span className="text-xs text-gray-600">{t('updatedAt', { date: updatedLabel })}</span>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {source === 'cohort'
          ? t('cohortSource', { count: cohortSize })
          : t('platformSource', { count: cohortSize })}
      </p>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{t('averageOrderValue')}</span>
            <span className={cn(
              'font-semibold',
              restaurant.avgOrderValue >= industry.avgOrderValue ? 'text-green-700' : 'text-red-700'
            )}>
              {formatCurrency(restaurant.avgOrderValue, locale)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              role="progressbar"
              aria-label={t('averageOrderValueProgress')}
              aria-valuemin={0}
              aria-valuemax={Math.max(industry.avgOrderValue, restaurant.avgOrderValue, 1)}
              aria-valuenow={restaurant.avgOrderValue}
              style={{ width: `${benchmarkWidth(restaurant.avgOrderValue, industry.avgOrderValue)}%` }}
            />
          </div>
          <p className="mt-0.5 text-xs text-gray-600">
            {t('industryAverage', { value: formatCurrency(industry.avgOrderValue, locale) })}
          </p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{t('repeatRate')}</span>
            <span className={cn(
              'font-semibold',
              restaurant.repeatRate >= industry.repeatRate ? 'text-green-700' : 'text-red-700'
            )}>
              {restaurant.repeatRate}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              role="progressbar"
              aria-label={t('repeatRateProgress')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={restaurant.repeatRate}
              style={{ width: `${benchmarkWidth(restaurant.repeatRate, industry.repeatRate)}%` }}
            />
          </div>
          <p className="mt-0.5 text-xs text-gray-600">
            {t('industryAverage', { value: `${industry.repeatRate}%` })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600">
        <RefreshCw className="h-3 w-3" />
        <span>{t('refreshCadence')}</span>
      </div>
    </div>
  );
}

function benchmarkWidth(value: number, baseline: number): number {
  if (value <= 0) return 0;
  if (baseline <= 0) return 100;
  return Math.min(Math.max((value / baseline) * 100, 0), 100);
}

function formatUpdatedAt(value: string | undefined, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
