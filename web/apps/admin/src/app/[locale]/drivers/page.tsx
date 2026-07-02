'use client';

import { useState } from 'react';
import { ApiClientError, type AdminDriver } from '@foodflow/api-client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MapPin, RefreshCw, ShieldX, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@foodflow/ui/empty-state';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Skeleton } from '@foodflow/ui/skeleton';
import { AdminDriversTable } from '@/components/drivers/admin-drivers-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGetEnvelope } from '@/lib/api';
import { Link } from '@/navigation';

const PAGE_SIZE = 20;

export default function DriversPage() {
  const t = useTranslations('drivers');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['drivers', page],
    queryFn: () => apiGetEnvelope<AdminDriver[]>('/admin/drivers', {
      params: { page, limit: PAGE_SIZE },
    }),
  });
  const drivers = query.data?.data ?? [];
  const total = query.data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isPermissionDenied = query.error instanceof ApiClientError && query.error.status === 403;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
        actions={(
          <Button asChild>
            <Link href="/drivers/map">
              <MapPin className="mr-2 h-4 w-4" />
              {t('viewMap')}
            </Link>
          </Button>
        )}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('listTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {query.isLoading ? t('loading') : t('total', { count: total })}
          </p>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : isPermissionDenied ? (
            <EmptyState
              icon={ShieldX}
              title={t('permissionDenied')}
              description={t('permissionDeniedDescription')}
            />
          ) : query.isError ? (
            <EmptyState
              icon={RefreshCw}
              title={t('loadError')}
              description={t('loadErrorDescription')}
              actionLabel={t('retry')}
              onAction={() => query.refetch()}
            />
          ) : drivers.length > 0 ? (
            <AdminDriversTable drivers={drivers} />
          ) : (
            <EmptyState icon={Users} title={t('emptyTitle')} description={t('emptyDescription')} />
          )}
        </CardContent>
      </Card>

      {!query.isLoading && !query.isError && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            aria-label={t('previousPage')}
            variant="outline"
            size="icon"
            onClick={() => setPage(current => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('page', { page, totalPages })}
          </span>
          <Button
            aria-label={t('nextPage')}
            variant="outline"
            size="icon"
            onClick={() => setPage(current => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
