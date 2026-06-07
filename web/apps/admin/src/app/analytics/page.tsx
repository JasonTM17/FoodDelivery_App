import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@foodflow/ui/page-header'
import AnalyticsKpiClient from './analytics-kpi-client'
import AnalyticsChartsClient from './analytics-charts-client'

function KpiSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: 'Phân tích' }]}
        title="Phân tích"
        description="Hiệu quả kinh doanh và hành vi khách hàng"
      />
      <Suspense fallback={<KpiSkeleton />}>
        <AnalyticsKpiClient />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[500px] rounded-lg" />}>
        <AnalyticsChartsClient />
      </Suspense>
    </div>
  )
}
