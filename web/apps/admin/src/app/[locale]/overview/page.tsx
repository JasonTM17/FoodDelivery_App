import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@foodflow/ui/page-header';
import { getTranslations } from 'next-intl/server';
import OverviewStats from './overview-stats';
import OverviewCharts from './overview-charts';
import OverviewRecentOrders from './overview-recent-orders';
import OverviewHeatmap from './overview-heatmap';

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  );
}

export default async function OverviewPage() {
  const t = await getTranslations('overview');
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
      />
      <Suspense fallback={<StatsSkeleton />}>
        <OverviewStats />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-80 rounded-lg" />}>
        <OverviewCharts />
      </Suspense>
      <OverviewHeatmap />
      <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
        <OverviewRecentOrders />
      </Suspense>
    </div>
  );
}
