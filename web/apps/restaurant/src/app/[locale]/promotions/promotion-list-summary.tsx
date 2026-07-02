'use client';

import { BarChart3, Plus, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PromotionListSummaryProps {
  total: number;
  active: number;
  draft: number;
  totalUsage: number;
}

interface PromotionPerformancePanelProps {
  activeCount: number;
  totalUsage: number;
}

interface PromotionEmptyStateProps {
  hasNoPromotions: boolean;
  onCreate: () => void;
}

export function PromotionListSummary({ total, active, draft, totalUsage }: PromotionListSummaryProps) {
  const t = useTranslations('promotions');
  const cards = [
    { label: t('stats.total'), value: total, className: 'text-gray-900' },
    { label: t('stats.active'), value: active, className: 'text-green-600' },
    { label: t('stats.draft'), value: draft, className: 'text-gray-600' },
    { label: t('stats.usage'), value: totalUsage, className: 'text-brand-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(card => (
        <div key={card.label} className="card text-center">
          <p className="mb-1 text-xs text-gray-500">{card.label}</p>
          <p className={`text-xl font-bold ${card.className}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export function PromotionPerformancePanel({ activeCount, totalUsage }: PromotionPerformancePanelProps) {
  const t = useTranslations('promotions');

  if (activeCount === 0) return null;

  return (
    <div className="card mt-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
        <BarChart3 className="h-4 w-4 text-brand-600" aria-hidden="true" />
        {t('performance.title')}
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label={t('performance.usage')} value={String(totalUsage)} tone="default" />
        <MetricCard label={t('performance.revenue')} value={t('performance.unavailable')} tone="muted" />
        <MetricCard label={t('performance.conversion')} value={t('performance.unavailable')} tone="muted" />
        <MetricCard label={t('performance.roi')} value={t('performance.unavailable')} tone="muted" />
      </div>
      <p className="mt-3 text-xs text-gray-500">{t('performance.degradedDescription')}</p>
    </div>
  );
}

export function PromotionEmptyState({ hasNoPromotions, onCreate }: PromotionEmptyStateProps) {
  const t = useTranslations('promotions');

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <Tag className="h-10 w-10 text-gray-300" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-gray-900">{t('emptyTitle')}</p>
      <p className="mt-1 text-xs text-gray-500">{hasNoPromotions ? t('emptySubtitle') : t('emptyFiltered')}</p>
      {hasNoPromotions ? (
        <button onClick={onCreate} className="btn-primary mt-4 inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('create')}
        </button>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'default' | 'muted';
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 text-center">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${tone === 'muted' ? 'text-gray-500' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
