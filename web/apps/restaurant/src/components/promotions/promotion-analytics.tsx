'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react';
import type { Promotion, PromotionAnalyticsData } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

interface PromotionAnalyticsProps {
  promotion: Promotion;
  analytics?: PromotionAnalyticsData;
}

export function PromotionAnalytics({ promotion, analytics }: PromotionAnalyticsProps) {
  const t = useTranslations('promotions.analytics');
  const locale = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale);
  const usageCount = analytics?.usageCount ?? promotion.usageCount ?? 0;

  if (!analytics) {
    return (
      <div className="space-y-4" data-testid="promotion-analytics">
        <h2 className="text-base font-semibold text-gray-900">{t('title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label={t('usage')} value={numberFormatter.format(usageCount)} icon={<Users className="h-4 w-4" />} />
          <UnavailableMetric label={t('revenue')} />
          <UnavailableMetric label={t('conversion')} />
          <UnavailableMetric label={t('roi')} />
        </div>
        <div className="rounded-lg border border-dashed p-4">
          <p className="font-medium text-gray-900">{t('degradedTitle')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('degradedDescription')}</p>
        </div>
      </div>
    );
  }

  const maxUsage = Math.max(...analytics.usageTimeline.map(point => point.count), 1);

  return (
    <div className="space-y-6" data-testid="promotion-analytics">
      <h2 className="text-base font-semibold text-gray-900">{t('title')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t('usage')} value={numberFormatter.format(analytics.usageCount)} icon={<Users className="h-4 w-4" />} />
        <KpiCard label={t('revenue')} value={formatCurrency(analytics.revenueAttributed, locale)} icon={<DollarSign className="h-4 w-4" />} />
        <KpiCard label={t('conversion')} value={`${numberFormatter.format(analytics.redemptionRate)}%`} icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard label={t('roi')} value={`${numberFormatter.format(analytics.roi)}%`} icon={<BarChart3 className="h-4 w-4" />} color={analytics.roi >= 100 ? 'text-green-600' : undefined} />
      </div>

      <div className="rounded-lg border p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">{t('timeline')}</h4>
        <div className="flex h-32 items-end gap-1">
          {analytics.usageTimeline.map((point) => {
            const height = (point.count / maxUsage) * 100;
            return (
              <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-brand-400 transition-colors hover:bg-brand-500"
                  style={{ height: `${height}%` }}
                  title={`${point.date}: ${numberFormatter.format(point.count)}`}
                />
              </div>
            );
          })}
          {analytics.usageTimeline.length === 0 ? (
            <p className="w-full self-center text-center text-sm text-gray-400">{t('emptyTimeline')}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="card text-center">
      <div className="mb-2 flex justify-center">{icon}</div>
      <p className={cn('text-lg font-bold', color || 'text-gray-900')}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function UnavailableMetric({ label }: { label: string }) {
  const t = useTranslations('promotions.analytics');
  return <KpiCard label={label} value={t('unavailable')} icon={<BarChart3 className="h-4 w-4" />} color="text-gray-500" />;
}
