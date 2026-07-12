'use client';

import type { RevenueSummary } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface RevenueSummaryCardsProps {
  summary: RevenueSummary;
  industryAvg?: { avgOrderValue: number; repeatCustomerRate: number };
}

export function RevenueSummaryCards({ summary, industryAvg }: RevenueSummaryCardsProps) {
  const locale = useLocale();
  const t = useTranslations('revenue');
  const promotionShare = summary.bySource.find(s => s.source === 'promotion')?.pct || 0;
  const industryOrderAverage = industryAvg?.avgOrderValue ?? 0;
  const industryDelta = industryOrderAverage > 0
    ? Math.round(((summary.avg.orderValue - industryOrderAverage) / industryOrderAverage) * 100)
    : undefined;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="revenue-summary-cards">
      <KpiCard
        label={t('totalRevenue')}
        value={formatCurrency(summary.total.vnd, locale)}
        delta={summary.delta.vsYesterday}
        sub={t('orderCount', { count: summary.total.orderCount })}
      />
      <KpiCard
        label={t('avgOrderValue')}
        value={formatCurrency(summary.avg.orderValue, locale)}
        sub={industryOrderAverage > 0
          ? t('industryAverage', { amount: formatCurrency(industryOrderAverage, locale) })
          : undefined}
        delta={industryDelta}
      />
      <KpiCard
        label={t('avgPerDay')}
        value={formatCurrency(summary.avg.perDay, locale)}
      />
      <KpiCard
        label={t('promotionTotal')}
        value={formatCurrency(summary.bySource.find(s => s.source === 'promotion')?.vnd || 0, locale)}
        sub={t('revenueShare', { pct: promotionShare })}
      />
    </div>
  );
}

function KpiCard({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: number | null }) {
  return (
    <div className="card text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-600">{sub}</p>}
      {delta !== undefined && delta !== null && delta !== 0 && (
        <p className={cn(
          'flex items-center justify-center gap-0.5 text-xs mt-1',
          delta > 0 ? 'text-green-700' : 'text-red-700'
        )}>
          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta > 0 ? '+' : ''}{delta}%
        </p>
      )}
    </div>
  );
}
