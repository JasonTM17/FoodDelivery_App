import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@foodflow/ui/breadcrumb';
import OverviewStats from './overview-stats';
import OverviewCharts from './overview-charts';
import OverviewRecentOrders from './overview-recent-orders';

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Tổng quan' }]} />
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-green-500 to-amber-500 bg-clip-text text-transparent">
          Tổng quan
        </h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan hoạt động của hệ thống FoodFlow
        </p>
      </div>
      <Suspense fallback={<StatsSkeleton />}>
        <OverviewStats />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-80 rounded-lg" />}>
        <OverviewCharts />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
        <OverviewRecentOrders />
      </Suspense>
    </div>
  );
}
