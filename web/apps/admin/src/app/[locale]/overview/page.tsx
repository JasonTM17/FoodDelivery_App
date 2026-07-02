import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/admin-page-header';
import { getTranslations } from 'next-intl/server';
import OverviewKpiClient from './overview-kpi-client';
import OverviewChartsClient from './overview-charts-client';
import OverviewDashboardClient from './overview-dashboard-client';

function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-lg" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-80 rounded-lg" />
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
      <Suspense fallback={<KpiSkeleton />}>
        <OverviewKpiClient />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <OverviewChartsClient />
      </Suspense>
      <Suspense fallback={
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      }>
        <OverviewDashboardClient />
      </Suspense>
    </div>
  );
}
