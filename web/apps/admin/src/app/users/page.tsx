import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@foodflow/ui/breadcrumb';
import UsersTableClient from './users-table-client';

function UsersTableSkeleton() {
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

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Người dùng' }]} />
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-green-500 to-amber-500 bg-clip-text text-transparent">
          Quản lý người dùng
        </h1>
        <p className="text-sm text-muted-foreground">Danh sách người dùng trong hệ thống</p>
      </div>
      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersTableClient />
      </Suspense>
    </div>
  );
}
