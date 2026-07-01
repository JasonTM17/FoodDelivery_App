import { Suspense } from 'react';
import { PageHeader } from '@foodflow/ui/page-header';
import OrdersTableClient from './orders-table-client';
import { getTranslations } from 'next-intl/server';

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

export default async function OrdersPage() {
  const t = await getTranslations('orders');
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
      />
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTableClient />
      </Suspense>
    </div>
  );
}
