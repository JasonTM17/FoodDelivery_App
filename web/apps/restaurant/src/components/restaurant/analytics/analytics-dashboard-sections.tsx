'use client';

import { useTranslations } from 'next-intl';
import type { RevenueSummary } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const CATEGORY_SEPARATOR = '\u00b7';

type HourlyRevenue = RevenueSummary['byHour'][number];
type CategoryRevenue = RevenueSummary['byCategory'][number];

interface AnalyticsHourlyOrdersSectionProps {
  hourly: HourlyRevenue[];
  locale: string;
}

interface AnalyticsCategoryRevenueSectionProps {
  categories: CategoryRevenue[];
  locale: string;
}

export function AnalyticsHourlyOrdersSection({ hourly, locale }: AnalyticsHourlyOrdersSectionProps) {
  const t = useTranslations('analytics');
  const maxOrders = Math.max(...hourly.map((hour) => hour.orderCount), 1);
  const hasHourlyData = hourly.some((hour) => hour.orderCount > 0 || hour.vnd > 0);

  return (
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
                <span className="truncate text-xs text-gray-600">{t('hourLabel', { hour: hour.hour })}</span>
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
                  <td>{formatCurrency(hour.vnd, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="py-10 text-center text-sm text-gray-600">{t('noData')}</p>
      )}
    </section>
  );
}

export function AnalyticsCategoryRevenueSection({ categories, locale }: AnalyticsCategoryRevenueSectionProps) {
  const t = useTranslations('analytics');
  const maxCategoryRevenue = Math.max(...categories.map((category) => category.vnd), 1);

  return (
    <section className="card" aria-labelledby="category-revenue-heading">
      <h2 id="category-revenue-heading" className="mb-4 text-base font-semibold text-gray-900">
        {t('byCategory')}
      </h2>
      {categories.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-600">{t('noCategories')}</p>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.categoryId}>
              <div className="mb-1.5 flex justify-between gap-3 text-sm">
                <span className="font-medium text-gray-700">{category.name}</span>
                <span className="shrink-0 text-gray-500">
                  {formatCurrency(category.vnd, locale)} {CATEGORY_SEPARATOR} {category.pct}%
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
                  <td>{formatCurrency(category.vnd, locale)}</td>
                  <td>{category.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
