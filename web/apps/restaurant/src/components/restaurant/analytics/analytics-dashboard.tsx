'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart3, DollarSign, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import type { RevenueSummary } from '@/lib/types';

type Period = '1' | '7' | '30';

const PERIODS: Array<{ id: Period; labelKey: 'today' | 'week' | 'month' }> = [
  { id: '1', labelKey: 'today' },
  { id: '7', labelKey: 'week' },
  { id: '30', labelKey: 'month' },
];

export function AnalyticsDashboard() {
  const t = useTranslations('analytics');
  const [period, setPeriod] = useState<Period>('7');
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<RevenueSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

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

  const categories = data?.byCategory.slice(0, 6) ?? [];
  const hourly = data?.byHour ?? [];
  const maxOrders = Math.max(...hourly.map((hour) => hour.orderCount), 1);
  const maxCategoryRevenue = Math.max(...categories.map((category) => category.vnd), 1);
  const hasHourlyData = hourly.some((hour) => hour.orderCount > 0 || hour.vnd > 0);

  const kpis = useMemo(() => ([
    {
      label: t('totalOrders'),
      value: data?.total.orderCount.toLocaleString('vi-VN') ?? '—',
      sub: t('totalOrdersSub'),
      icon: <ShoppingBag className="h-4 w-4 text-blue-600" />,
      bg: 'bg-blue-100',
    },
    {
      label: t('totalRevenue'),
      value: data ? formatCurrency(data.total.vnd) : '—',
      sub: t('totalRevenueSub'),
      icon: <DollarSign className="h-4 w-4 text-green-600" />,
      bg: 'bg-green-100',
    },
    {
      label: t('avgOrderValue'),
      value: data ? formatCurrency(data.avg.orderValue) : '—',
      sub: t('avgOrderValueSub', { amount: data ? formatCurrency(data.avg.perDay) : '—' }),
      icon: <TrendingUp className="h-4 w-4 text-purple-600" />,
      bg: 'bg-purple-100',
    },
  ]), [data, t]);

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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', kpi.bg)}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="mt-1 text-xs text-gray-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card" aria-labelledby="hourly-orders-heading">
          <h2 id="hourly-orders-heading" className="mb-4 text-base font-semibold text-gray-900">
            {t('hourlyOrders')}
          </h2>
          {hasHourlyData ? (
            <>
              <div className="flex h-40 items-end gap-1" aria-hidden="true">
                {hourly.map((hour) => (
                  <div key={hour.hour} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm bg-brand-500 opacity-80 transition-opacity hover:opacity-100"
                      style={{ height: `${Math.max(4, (hour.orderCount / maxOrders) * 128)}px` }}
                      title={t('hourTooltip', { hour: hour.hour, count: hour.orderCount })}
                    />
                    <span className="truncate text-xs text-gray-400">{t('hourLabel', { hour: hour.hour })}</span>
                  </div>
                ))}
              </div>
              <table className="sr-only">
                <caption>{t('ordersByHourTable')}</caption>
                <thead>
                  <tr>
                    <th>{t('hourColumn')}</th>
                    <th>{t('ordersColumn')}</th>
                    <th>{t('revenueColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {hourly.map((hour) => (
                    <tr key={hour.hour}>
                      <td>{t('hourLabel', { hour: hour.hour })}</td>
                      <td>{hour.orderCount}</td>
                      <td>{formatCurrency(hour.vnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-gray-400">{t('noData')}</p>
          )}
        </section>

        <section className="card" aria-labelledby="category-revenue-heading">
          <h2 id="category-revenue-heading" className="mb-4 text-base font-semibold text-gray-900">
            {t('byCategory')}
          </h2>
          {categories.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">{t('noCategories')}</p>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.categoryId}>
                  <div className="mb-1.5 flex justify-between gap-3 text-sm">
                    <span className="font-medium text-gray-700">{category.name}</span>
                    <span className="shrink-0 text-gray-500">
                      {formatCurrency(category.vnd)} · {category.pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${(category.vnd / maxCategoryRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <table className="sr-only">
                <caption>{t('categoryRevenueTable')}</caption>
                <thead>
                  <tr>
                    <th>{t('categoryColumn')}</th>
                    <th>{t('revenueColumn')}</th>
                    <th>{t('shareColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.categoryId}>
                      <td>{category.name}</td>
                      <td>{formatCurrency(category.vnd)}</td>
                      <td>{category.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AnalyticsDashboardSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6" role="status" aria-label={label}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="kpi-card space-y-3">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
            <div className="skeleton h-8 w-32" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card"><div className="skeleton h-56" /></div>
        <div className="card"><div className="skeleton h-56" /></div>
      </div>
    </div>
  );
}
