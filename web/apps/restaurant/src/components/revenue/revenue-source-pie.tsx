'use client';

import { formatCurrency } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

interface RevenueSourcePieProps {
  data: { source: string; vnd: number; pct: number }[];
}

const COLORS: Record<string, string> = {
  organic: '#10B981',
  promotion: '#F97316',
  referral: '#8B5CF6',
  search: '#3B82F6',
};

const SOURCE_KEYS = {
  organic: 'sources.organic',
  promotion: 'sources.promotion',
  referral: 'sources.referral',
  search: 'sources.search',
} as const;

export function RevenueSourcePie({ data }: RevenueSourcePieProps) {
  const locale = useLocale();
  const t = useTranslations('revenue.sources');

  return (
    <div className="space-y-3" data-testid="revenue-source-pie">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>

      {data.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
          {t('empty')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.map((item) => {
            const labelKey = SOURCE_KEYS[item.source as keyof typeof SOURCE_KEYS];
            const label = labelKey ? t(labelKey) : item.source;

            return (
              <div key={item.source} className="flex items-center gap-3 rounded-lg border p-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: COLORS[item.source] || '#6B7280' }}
                  aria-hidden="true"
                >
                  {label.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">
                    {t('value', {
                      amount: formatCurrency(item.vnd, locale),
                      pct: item.pct,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
