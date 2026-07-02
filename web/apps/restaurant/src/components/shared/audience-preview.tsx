'use client';

import { Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTargetingPreview } from '@/hooks/use-targeting-preview';
import type { PromotionTarget } from '@/lib/types';

interface AudiencePreviewProps {
  target: PromotionTarget;
}

export function AudiencePreview({ target }: AudiencePreviewProps) {
  const locale = useLocale();
  const t = useTranslations('promotionTargeting');
  const { data, error, isLoading, retry } = useTargetingPreview(target);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3" role="status">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-sm text-red-700">{t('error')}</p>
        <button type="button" onClick={retry} className="text-sm font-medium text-red-700 underline">
          {t('retry')}
        </button>
      </div>
    );
  }

  const audienceLabel = t(`audiences.${target.audience}`);
  const formattedReach = data.estimatedReach.toLocaleString(locale);

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-brand-100 bg-brand-50 p-3"
      data-testid="audience-preview"
      aria-live="polite"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
        <Users className="h-4 w-4 text-brand-600" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-brand-700">{audienceLabel}</p>
        <p className="text-xs text-brand-600">
          {data.estimatedReach === 0 ? t('empty') : t('estimate', { count: formattedReach })}
        </p>
      </div>
    </div>
  );
}
