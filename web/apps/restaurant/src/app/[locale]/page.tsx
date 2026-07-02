'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { BarChart3, RefreshCw } from 'lucide-react';
import RecentOrdersCard from '@/components/dashboard/recent-orders-card';
import { RevenueSummaryCards } from '@/components/revenue/revenue-summary-cards';
import { RevenueAreaChart } from '@/components/revenue/revenue-area-chart';
import { CategoryMixDonut } from '@/components/revenue/category-mix-donut';
import { BestSellersList } from '@/components/insights/best-sellers-list';
import { api } from '@/lib/api';
import type { RestaurantDashboard } from '@/lib/types';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [dashboard, setDashboard] = useState<RestaurantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<RestaurantDashboard>('/restaurant/dashboard?days=7');
      setDashboard(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('loadError');
      setDashboard(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <BarChart3 className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            <span className="gradient-text">{t('title')}</span>
          </h1>
          <p className="text-sm text-gray-500">{t('description')}</p>
        </div>
      </div>

      {error && <RetryableError message={error} onRetry={loadDashboard} />}

      {!dashboard ? (
        <div className="card py-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <h2 className="text-sm font-semibold text-gray-900">{t('emptyTitle')}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
        <>
          <RevenueSummaryCards summary={dashboard.summary} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <RevenueAreaChart data={dashboard.summary.byDay} periodLabel={t('last7Days')} />
            </div>
            <div className="card">
              <CategoryMixDonut data={dashboard.summary.byCategory} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 card">
              <BestSellersList items={dashboard.bestSellers} />
            </div>

            <RecentOrdersCard
              orders={dashboard.recentOrders}
              onOpenOrder={(id) => router.push(`/orders/${id}`)}
              onOpenAll={() => router.push('/orders')}
            />
          </div>
        </>
      )}
    </div>
  );
}
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="card h-28 skeleton" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card h-64 skeleton" />
        <div className="card h-64 skeleton" />
      </div>
    </div>
  );
}

function RetryableError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations('dashboard');

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {t('retry')}
      </button>
    </div>
  );
}

