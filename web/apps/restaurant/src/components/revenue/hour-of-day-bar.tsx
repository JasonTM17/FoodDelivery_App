'use client';

import { formatCurrency, cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

interface HourOfDayBarProps {
  data: { hour: number; vnd: number; orderCount: number }[];
}

export function HourOfDayBar({ data }: HourOfDayBarProps) {
  const locale = useLocale();
  const t = useTranslations('revenue.hourly');
  const hasData = data.some((item) => item.vnd > 0 || item.orderCount > 0);
  const maxVal = Math.max(...data.map(d => d.vnd), 1);
  const peakThreshold = maxVal * 0.6;
  const peakStart = data.findIndex(d => d.vnd >= peakThreshold);
  const peakEnd = data.length - 1 - [...data].reverse().findIndex(d => d.vnd >= peakThreshold);

  return (
    <div className="space-y-3" data-testid="hour-of-day-bar">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>

      {!hasData ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
          {t('empty')}
        </p>
      ) : (
        <>
          <div
            className="relative flex h-28 items-end gap-0.5"
            role="img"
            aria-label={t('chartAria')}
          >
            {peakStart >= 0 && peakEnd >= peakStart && (
              <div
                className="absolute inset-y-0 rounded-sm bg-brand-50/50"
                aria-hidden="true"
                style={{
                  left: `${(peakStart / data.length) * 100}%`,
                  width: `${((peakEnd - peakStart + 1) / data.length) * 100}%`,
                }}
              />
            )}

            {data.map((item) => {
              const height = (item.vnd / maxVal) * 100;
              return (
                <div
                  key={item.hour}
                  className="group flex flex-1 flex-col justify-end"
                  title={t('tooltip', {
                    hour: item.hour,
                    amount: formatCurrency(item.vnd, locale),
                    count: item.orderCount,
                  })}
                >
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-colors hover:bg-brand-600',
                      item.vnd >= peakThreshold ? 'bg-brand-500' : 'bg-gray-300',
                    )}
                    style={{ height: `${height}%`, minHeight: item.vnd > 0 ? '2px' : '0' }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-gray-400" aria-hidden="true">
            <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-brand-500" aria-hidden="true" />
              <span>{t('peak')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-gray-300" aria-hidden="true" />
              <span>{t('offPeak')}</span>
            </div>
          </div>

          <table className="sr-only">
            <caption>{t('tableCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('columns.hour')}</th>
                <th scope="col">{t('columns.revenue')}</th>
                <th scope="col">{t('columns.orders')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.hour}>
                  <td>{t('hourLabel', { hour: item.hour })}</td>
                  <td>{formatCurrency(item.vnd, locale)}</td>
                  <td>{item.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
