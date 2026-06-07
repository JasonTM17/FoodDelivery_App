import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@foodflow/ui/page-header';
import OrdersTableClient from './orders-table-client';

function OrdersTableSkeleton() {
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

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: 'Đơn hàng' }]}
        title="Quản lý đơn hàng"
        description="Xem và quản lý tất cả đơn hàng trong hệ thống"
      />
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTableClient />
      </Suspense>
    </div>
  );
}
