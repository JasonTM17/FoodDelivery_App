'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft, Tag, Calendar, Users,
  Edit, Pause, Play,
} from 'lucide-react';
import { PromotionAnalytics } from '@/components/promotions/promotion-analytics';
import { PromotionDetailField } from '@/components/promotions/promotion-detail-field';
import { PromotionDetailLimitsCard } from '@/components/promotions/promotion-detail-limits-card';
import { fetchPromotionDetail, updatePromotionStatus } from '@/lib/actions/promotion-actions';
import { getPromotionStatusColor } from '@/lib/promotion-engine';
import { formatCurrency, cn } from '@/lib/utils';
import type { Promotion, PromotionAnalyticsData, PromotionStatus } from '@/lib/types';

const EMPTY_VALUE = '\u2014';

export default function PromotionDetailPage() {
  const routeParams = useParams<{ id: string }>();
  const promotionId = typeof routeParams.id === 'string' ? routeParams.id : '';
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('promotions.detail');
  const tStatus = useTranslations('promotions.status');
  const tTypes = useTranslations('promotions.types');
  const tAudience = useTranslations('promotions.audience');
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [analytics, setAnalytics] = useState<PromotionAnalyticsData | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!promotionId) {
      setLoading(false);
      setError(t('notFound'));
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchPromotionDetail(promotionId)
      .then((data) => {
        if (!cancelled) {
          setPromo(data.promotion);
          setAnalytics(data.analytics);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError((err as { message?: string }).message || t('loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [promotionId, t]);

  const handleStatusChange = async (status: PromotionStatus) => {
    if (!promo) return;
    setProcessing(true);
    try {
      const updated = await updatePromotionStatus(promo.id, status);
      setPromo(updated);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('actionError'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="h-40 rounded-lg bg-gray-100 animate-pulse" />;
  }

  if (error || !promo) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {error || t('notFound')}
      </div>
    );
  }

  const formatValue = () => {
    switch (promo.type) {
      case 'percent': return `${promo.discountValue}%`;
      case 'fixed': return formatCurrency(promo.discountValue, locale);
      case 'bogof':
        return promo.comboConfig
          ? t('buyGet', { buy: promo.comboConfig.buy, get: promo.comboConfig.get })
          : EMPTY_VALUE;
      case 'combo':
        return t('comboPrice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push('/promotions')} className="btn-ghost -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t('back')}
        </button>
        <div className="flex items-center gap-2">
          {promo.status === 'active' && (
            <button
              onClick={() => handleStatusChange('paused')}
              disabled={processing}
              className="btn-ghost text-yellow-600 text-sm"
            >
              <Pause className="h-4 w-4 mr-1" />
              {t('pause')}
            </button>
          )}
          {promo.status === 'paused' && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={processing}
              className="btn-ghost text-green-600 text-sm"
            >
              <Play className="h-4 w-4 mr-1" />
              {t('resume')}
            </button>
          )}
          <button
            onClick={() => router.push(`/promotions/${promo.id}/edit`)}
            className="btn-secondary text-sm"
          >
            <Edit className="h-4 w-4 mr-1" />
            {t('edit')}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
              <Tag className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{promo.name}</h1>
              <p className="font-mono text-xs text-gray-500">{promo.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', getPromotionStatusColor(promo.status))}>
              {tStatus(promo.status)}
            </span>
            <span className="badge bg-brand-50 text-brand-700 border-brand-200">
              {tTypes(promo.type)}
            </span>
          </div>
        </div>

        {promo.description && (
          <p className="text-sm text-gray-600 mt-4">{promo.description}</p>
        )}

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <PromotionDetailField label={t('value')} value={formatValue()} />
          <PromotionDetailField
            label={t('audience')}
            value={
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                {tAudience(promo.target.audience)}
              </span>
            }
          />
          <PromotionDetailField
            label={t('time')}
            value={
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {new Date(promo.schedule.validFrom).toLocaleDateString(locale)}
                {' - '}
                {new Date(promo.schedule.validUntil).toLocaleDateString(locale)}
              </span>
            }
          />
          <PromotionDetailField
            label={t('channels')}
            value={promo.channels.map((ch) => {
              return t(`channelLabels.${ch}`);
            }).join(', ')}
          />
        </dl>
      </div>

      <PromotionDetailLimitsCard promo={promo} />

      <PromotionAnalytics promotion={promo} analytics={analytics} />
    </div>
  );
}
