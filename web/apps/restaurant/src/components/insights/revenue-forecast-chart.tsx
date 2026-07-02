'use client';

import { cn, formatCurrency } from '@/lib/utils';
import type { RevenueForecastPoint } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface RevenueForecastChartProps {
  data: RevenueForecastPoint[];
}

export function RevenueForecastChart({ data }: RevenueForecastChartProps) {
  const t = useTranslations('insights.revenueForecast');
  const maxVal = Math.max(...data.map((point) => Math.max(point.upper || point.predicted, point.actual || 0)), 1);

  return (
    <div className="space-y-3" data-testid="revenue-forecast-chart">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>

      {data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
          <p className="text-sm text-gray-500">{t('empty')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-0.5 h-40" aria-label={t('chartLabel')}>
            {data.map((point) => {
              const actualHeight = ((point.actual || 0) / maxVal) * 100;
              const predictedHeight = (point.predicted / maxVal) * 100;
              const lowerHeight = ((point.lower || point.predicted * 0.85) / maxVal) * 100;
              const upperHeight = ((point.upper || point.predicted * 1.15) / maxVal) * 100;

              return (
                <div key={point.date} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-brand-200/30 absolute"
                    style={{ bottom: `${lowerHeight}%`, height: `${upperHeight - lowerHeight}%` }}
                    title={t('confidenceTitle', {
                      lower: formatCurrency(point.lower || 0),
                      upper: formatCurrency(point.upper || 0),
                    })}
                  />
                  {point.actual && (
                    <div
                      className="w-full bg-brand-500 rounded-t-sm"
                      style={{ height: `${actualHeight}%` }}
                      title={t('actualTitle', { amount: formatCurrency(point.actual) })}
                    />
                  )}
                  <div
                    className={cn(
                      'w-full rounded-t-sm',
                      point.actual ? 'bg-brand-200 opacity-50' : 'bg-brand-400'
                    )}
                    style={{ height: `${point.actual ? 0 : predictedHeight}%` }}
                    title={t('predictedTitle', { amount: formatCurrency(point.predicted) })}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <LegendSwatch className="bg-brand-500" label={t('actual')} />
            <LegendSwatch className="bg-brand-400" label={t('predicted')} />
            <LegendSwatch className="bg-brand-200/50 border border-brand-300" label={t('confidence')} />
          </div>
        </>
      )}
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={cn('h-3 w-3 rounded-sm', className)} />
      <span>{label}</span>
    </div>
  );
}
