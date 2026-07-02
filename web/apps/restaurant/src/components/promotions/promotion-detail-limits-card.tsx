'use client';

import { useTranslations } from 'next-intl';
import type { Promotion } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { PromotionDetailField } from './promotion-detail-field';

export function PromotionDetailLimitsCard({ promo }: { promo: Promotion }) {
  const t = useTranslations('promotions.detail');

  return (
    <div className="card">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{t('limitsTitle')}</h2>
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PromotionDetailField label={t('minOrder')} value={promo.minOrderVnd ? formatCurrency(promo.minOrderVnd) : t('none')} />
        <PromotionDetailField label={t('maxDiscount')} value={promo.maxDiscountVnd ? formatCurrency(promo.maxDiscountVnd) : t('unlimited')} />
        <PromotionDetailField label={t('maxUsage')} value={promo.maxUsage?.toString() || t('unlimited')} />
        <PromotionDetailField label={t('perUserLimit')} value={promo.perUserLimit.toString()} />
      </dl>
      {promo.stackable && (
        <span className="badge bg-blue-50 text-blue-700 border-blue-200 mt-4">
          {t('stackable')}
        </span>
      )}
    </div>
  );
}
