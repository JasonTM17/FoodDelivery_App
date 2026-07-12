'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Tag } from 'lucide-react';
import { PromotionBulkActions } from '@/components/promotions/promotion-bulk-actions';
import { PromotionCard } from '@/components/promotions/promotion-card';
import { api } from '@/lib/api';
import type { Promotion, PromotionAnalyticsData, PromotionStatus } from '@/lib/types';
import { useRouter } from '@/navigation';
import { fetchPromotions } from '@/lib/actions/promotion-actions';
import { PromotionEmptyState, PromotionListSummary, PromotionPerformancePanel } from './promotion-list-summary';

const statusFilters = ['all', 'active', 'scheduled', 'draft', 'paused', 'expired'] as const;

export default function PromotionsListPage() {
  const router = useRouter();
  const t = useTranslations('promotions');
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [analytics, setAnalytics] = useState<PromotionAnalyticsData | undefined>();
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPromotions()
      .then((data) => {
        if (!cancelled) {
          setPromos(data.promotions ?? []);
          setAnalytics(data.analytics);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || t('listError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return promos.filter((promo) => {
      if (statusFilter !== 'all' && promo.status !== statusFilter) return false;
      if (!query) return true;
      return promo.name.toLowerCase().includes(query) || promo.code.toLowerCase().includes(query);
    });
  }, [promos, search, statusFilter]);

  const activeCount = promos.filter(promo => promo.status === 'active').length;
  const draftCount = promos.filter(promo => promo.status === 'draft').length;
  const totalUsage = promos.reduce((sum, promo) => sum + (promo.usageCount ?? 0), 0);

  const handlePause = async (id: string) => {
    try {
      await api.patch(`/restaurant/promotions/${id}`, { status: 'paused' });
      setPromos(prev => prev.map(promo => (promo.id === id ? { ...promo, status: 'paused' } : promo)));
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('pauseError'));
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm(t('archiveConfirm'))) return;
    try {
      await api.patch(`/restaurant/promotions/${id}`, { status: 'archived' });
      setPromos(prev => prev.map(promo => (promo.id === id ? { ...promo, status: 'archived' } : promo)));
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('archiveError'));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAction = async (action: 'pause' | 'resume' | 'archive') => {
    if (isSubmitting) return;
    if (action === 'archive' && !window.confirm(t('archiveConfirm'))) return;
    setIsSubmitting(true);
    try {
      await api.post('/restaurant/promotions/bulk', { ids: Array.from(selectedIds), action });
      const nextStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'archived';
      setPromos(prev => prev.map(promo => (selectedIds.has(promo.id) ? { ...promo, status: nextStatus } : promo)));
      setSelectedIds(new Set());
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('bulkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-label={t('loading')}>
        {[1, 2, 3].map(item => (
          <div key={item} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <Tag className="h-5 w-5 text-brand-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('listTitle')}</h1>
            <p className="text-sm text-gray-500">{t('listSubtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/promotions/new')}
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('create')}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <PromotionListSummary total={promos.length} active={activeCount} draft={draftCount} totalUsage={totalUsage} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {statusFilters.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'border border-brand-200 bg-brand-100 text-brand-700'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-brand-300'
              }`}
            >
              {status === 'all' ? t('status.all') : t(`status.${status}`)}
            </button>
          ))}
        </div>
      </div>

      <PromotionBulkActions
        selectedIds={Array.from(selectedIds)}
        onPause={() => handleBulkAction('pause')}
        onResume={() => handleBulkAction('resume')}
        onArchive={() => handleBulkAction('archive')}
        onClear={() => setSelectedIds(new Set())}
      />

      {filtered.length === 0 ? (
        <PromotionEmptyState hasNoPromotions={promos.length === 0} onCreate={() => router.push('/promotions/new')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map(promo => (
            <div key={promo.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selectedIds.has(promo.id)}
                onChange={() => toggleSelect(promo.id)}
                className="mt-5 rounded border-gray-300"
                aria-label={t('selectPromotion', { code: promo.code })}
              />
              <div className="flex-1">
                <PromotionCard
                  promotion={promo}
                  onClick={() => router.push(`/promotions/${promo.id}`)}
                  onPause={() => handlePause(promo.id)}
                  onArchive={() => handleArchive(promo.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <PromotionPerformancePanel activeCount={activeCount} totalUsage={totalUsage} analytics={analytics} />
    </div>
  );
}
