import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/admin-page-header'
import AiMonitorWorkflowsClient from './ai-monitor-workflows-client'
import AiMonitorStatsClient from './ai-monitor-stats-client';
import { getTranslations } from 'next-intl/server';

function WorkflowsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
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
      <Suspense fallback={<WorkflowsSkeleton />}>
        <AiMonitorWorkflowsClient />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
        <AiMonitorStatsClient />
      </Suspense>
    </div>
  )
}
