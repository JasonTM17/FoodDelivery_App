import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@foodflow/ui/breadcrumb';
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
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Đơn hàng' }]} />
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-green-500 to-amber-500 bg-clip-text text-transparent">
          Quản lý đơn hàng
        </h1>
        <p className="text-sm text-muted-foreground">
          Xem và quản lý tất cả đơn hàng trong hệ thống
        </p>
      </div>
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTableClient />
      </Suspense>
    </div>
  );
}
