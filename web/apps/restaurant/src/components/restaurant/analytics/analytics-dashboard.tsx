'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BarChart3, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import type { RevenueSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AnalyticsKpiGrid } from './analytics-dashboard-kpis';
import { AnalyticsCategoryRevenueSection, AnalyticsHourlyOrdersSection } from './analytics-dashboard-sections';
import { AnalyticsDashboardSkeleton } from './analytics-dashboard-skeleton';

type Period = '1' | '7' | '30';

const PERIODS: Array<{ id: Period; labelKey: 'today' | 'week' | 'month' }> = [
  { id: '1', labelKey: 'today' },
  { id: '7', labelKey: 'week' },
  { id: '30', labelKey: 'month' },
];

export function AnalyticsDashboard() {
  const t = useTranslations('analytics');
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>('7');
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<RevenueSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    api
      .get<RevenueSummary>(`/restaurant/revenue/summary?days=${period}`)
      .then((summary) => {
        if (cancelled) return;
        setData(summary);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [period, reloadKey]);

  if (status === 'loading') return <AnalyticsDashboardSkeleton label={t('loading')} />;

  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <BarChart3 className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-base font-semibold text-red-900">{t('errorTitle')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-red-700">{t('errorDescription')}</p>
        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          className="btn-primary mt-5 inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t('retry')}
        </button>
      </div>
    );
  }

  const categories = data?.byCategory.slice(0, 6) ?? [];
  const hourly = data?.byHour ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <BarChart3 className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500">{t('description')}</p>
          </div>
        </div>

        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                period === item.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <AnalyticsKpiGrid data={data} locale={locale} numberFormatter={numberFormatter} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnalyticsHourlyOrdersSection hourly={hourly} locale={locale} />
        <AnalyticsCategoryRevenueSection categories={categories} locale={locale} />
      </div>
    </div>
  );
}
