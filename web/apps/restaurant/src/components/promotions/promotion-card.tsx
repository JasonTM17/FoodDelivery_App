'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Calendar, Users } from 'lucide-react';
import type { Promotion } from '@/lib/types';
import { getPromotionStatusColor } from '@/lib/promotion-engine';
import { cn } from '@/lib/utils';

interface PromotionCardProps {
  promotion: Promotion;
  onClick?: () => void;
  onArchive?: () => void;
  onPause?: () => void;
}

const dateLocales: Record<string, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  vi: 'vi-VN',
};

export function PromotionCard({ promotion, onClick, onArchive, onPause }: PromotionCardProps) {
  const t = useTranslations('promotions');
  const locale = useLocale();
  const dateLocale = dateLocales[locale] ?? 'vi-VN';

  return (
    <div
      className="card cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
      data-testid="promotion-card"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-gray-900">{promotion.code}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs', getPromotionStatusColor(promotion.status))}>
              {t(`status.${promotion.status}`)}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-600">{promotion.name}</p>
        </div>
        <span className="badge border-brand-200 bg-brand-50 text-brand-700">
          {t(`types.${promotion.type}`)}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          {new Date(promotion.schedule.validFrom).toLocaleDateString(dateLocale)}
          {' - '}
          {new Date(promotion.schedule.validUntil).toLocaleDateString(dateLocale)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" aria-hidden="true" />
          {t(`audience.${promotion.target.audience}`)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {onPause && promotion.status === 'active' ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPause();
            }}
            className="btn-ghost text-xs text-yellow-600"
          >
            {t('pause')}
          </button>
        ) : null}
        {onArchive && (promotion.status === 'expired' || promotion.status === 'draft') ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onArchive();
            }}
            className="btn-ghost text-xs text-gray-500"
          >
            {t('archive')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
