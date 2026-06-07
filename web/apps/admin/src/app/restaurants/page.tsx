import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@foodflow/ui/page-header';
import RestaurantsTableClient from './restaurants-table-client';

function RestaurantsTableSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function RestaurantsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: 'Nhà hàng' }]}
        title="Quản lý nhà hàng"
        description="Danh sách nhà hàng đối tác"
      />
      <Suspense fallback={<RestaurantsTableSkeleton />}>
        <RestaurantsTableClient />
      </Suspense>
    </div>
  );
}
