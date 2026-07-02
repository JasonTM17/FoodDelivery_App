'use client';

import type { RevenueSummary } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface RevenueComparisonProps {
  summary: RevenueSummary;
}

export function RevenueComparison({ summary }: RevenueComparisonProps) {
  const locale = useLocale();
  const t = useTranslations('revenue.comparison');

  return (
    <div className="space-y-3" data-testid="revenue-comparison">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <ComparisonCard
          label={t('lastWeek')}
          value={formatDeltaValue(
            summary.total.vnd,
            summary.delta.vsLastWeek,
            locale,
            t('insufficientData'),
          )}
          delta={summary.delta.vsLastWeek}
          unavailableLabel={t('unavailable')}
        />
        <ComparisonCard
          label={t('lastMonth')}
          value={formatDeltaValue(
            summary.total.vnd,
            summary.delta.vsLastMonth,
            locale,
            t('insufficientData'),
          )}
          delta={summary.delta.vsLastMonth}
          unavailableLabel={t('unavailable')}
        />
      </div>
    </div>
  );
}

function formatDeltaValue(
  current: number,
  delta: number | null,
  locale: string,
  insufficientData: string,
): string {
  if (delta === null || delta <= -100) return insufficientData;
  const previous = current / (1 + delta / 100);
  return formatCurrency(Math.abs(current - previous), locale);
}

function ComparisonCard({
  label,
  value,
  delta,
  unavailableLabel,
}: {
  label: string;
  value: string;
  delta: number | null;
  unavailableLabel: string;
}) {
  const Icon = delta === null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-lg border border-gray-100 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={cn(
          'mt-1 flex items-center justify-center gap-1 text-sm font-bold',
          delta === null
            ? 'text-gray-400'
            : delta > 0
              ? 'text-green-600'
              : delta < 0
                ? 'text-red-500'
                : 'text-gray-500',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {delta === null ? unavailableLabel : `${delta > 0 ? '+' : ''}${delta}%`}
      </p>
      <p className="mt-0.5 text-xs text-gray-400">{value}</p>
    </div>
  );
}
