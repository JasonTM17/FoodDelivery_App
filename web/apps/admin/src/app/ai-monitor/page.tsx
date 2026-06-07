import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@foodflow/ui/page-header'
import AiMonitorWorkflowsClient from './ai-monitor-workflows-client'
import AiMonitorStatsClient from './ai-monitor-stats-client'

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

export default function AiMonitorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: 'AI & N8N' }]}
        title="AI & N8N Monitor"
        description="Giám sát workflow tự động và trợ lý AI của nền tảng FoodFlow"
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
