'use client';

import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RevenueSummary } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';

const EMPTY_VALUE = '\u2014';

interface AnalyticsKpiGridProps {
  data: RevenueSummary | null;
  locale: string;
  numberFormatter: Intl.NumberFormat;
}

export function AnalyticsKpiGrid({ data, locale, numberFormatter }: AnalyticsKpiGridProps) {
  const t = useTranslations('analytics');

  const kpis = [
    {
      label: t('totalOrders'),
      value: data ? numberFormatter.format(data.total.orderCount) : EMPTY_VALUE,
      sub: t('totalOrdersSub'),
      icon: <ShoppingBag className="h-4 w-4 text-blue-600" />,
      bg: 'bg-blue-100',
    },
    {
      label: t('totalRevenue'),
      value: data ? formatCurrency(data.total.vnd, locale) : EMPTY_VALUE,
      sub: t('totalRevenueSub'),
      icon: <DollarSign className="h-4 w-4 text-green-600" />,
      bg: 'bg-green-100',
    },
    {
      label: t('avgOrderValue'),
      value: data ? formatCurrency(data.avg.orderValue, locale) : EMPTY_VALUE,
      sub: t('avgOrderValueSub', {
        amount: data ? formatCurrency(data.avg.perDay, locale) : EMPTY_VALUE,
      }),
      icon: <TrendingUp className="h-4 w-4 text-purple-600" />,
      bg: 'bg-purple-100',
    },
  ];

  return (
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
          <p className="mt-1 text-xs text-gray-600">{kpi.sub}</p>
        </div>
      ))}
    </div>
  );
}
