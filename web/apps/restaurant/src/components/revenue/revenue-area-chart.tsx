'use client';

import { formatCurrency } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

interface RevenueAreaChartProps {
  data: { date: string; vnd: number; orderCount: number }[];
  comparison?: { date: string; vnd: number }[];
  periodLabel?: string;
}

export function RevenueAreaChart({ data, comparison, periodLabel }: RevenueAreaChartProps) {
  const locale = useLocale();
  const t = useTranslations('revenue');
  const maxVal = Math.max(
    ...data.map(d => d.vnd),
    ...(comparison?.map(c => c.vnd) || []),
    1
  );

  return (
    <div className="space-y-3" data-testid="revenue-area-chart">
      {periodLabel && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">{t('revenueForPeriod', { period: periodLabel })}</h4>
        </div>
      )}

      {data.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
          {t('daily.empty')}
        </p>
      ) : (
        <>
          <div
            className="relative flex h-40 items-end gap-0.5"
            role="img"
            aria-label={t('daily.chartAria')}
          >
            {[0, 25, 50, 75].map((pct) => (
              <div
                key={pct}
                className="absolute inset-x-0 border-t border-gray-100"
                style={{ bottom: `${pct}%` }}
                aria-hidden="true"
              />
            ))}

            {data.map((point) => {
              const height = (point.vnd / maxVal) * 100;
              return (
                <div
                  key={point.date}
                  className="group relative flex flex-1 flex-col justify-end"
                  title={t('daily.tooltip', {
                    date: point.date,
                    amount: formatCurrency(point.vnd, locale),
                    count: point.orderCount,
                  })}
                >
                  <div
                    className="w-full rounded-t-sm bg-brand-400/60 transition-colors hover:bg-brand-400"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500" aria-hidden="true">
            <span>{data[0]?.date}</span>
            <span>{data[data.length - 1]?.date}</span>
          </div>

          <table className="sr-only">
            <caption>{t('daily.tableCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('daily.columns.date')}</th>
                <th scope="col">{t('daily.columns.revenue')}</th>
                <th scope="col">{t('daily.columns.orders')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.date}>
                  <td>{point.date}</td>
                  <td>{formatCurrency(point.vnd, locale)}</td>
                  <td>{point.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {comparison && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-brand-400/60" aria-hidden="true" />
            <span>{t('currentPeriod')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
