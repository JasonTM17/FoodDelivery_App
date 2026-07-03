import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/admin-page-header'
import AiMonitorProviderClient from './ai-monitor-provider-client'
import AiMonitorStatsClient from './ai-monitor-stats-client';
import { getTranslations } from 'next-intl/server';

function ProviderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  )
}

export default async function AiMonitorPage() {
  const t = await getTranslations('aiMonitor');
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
      />
      <Suspense fallback={<ProviderSkeleton />}>
        <AiMonitorProviderClient />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
        <AiMonitorStatsClient />
      </Suspense>
    </div>
  )
}
