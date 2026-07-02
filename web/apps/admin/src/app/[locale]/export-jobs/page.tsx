'use client';

import { useState } from 'react';
import type { AdminExportJob, AdminExportJobsPayload } from '@foodflow/api-client';
import { ApiClientError } from '@foodflow/api-client';
import { useQuery } from '@tanstack/react-query';
import { FileText, RefreshCw, ShieldX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@foodflow/ui/empty-state';
import { PageHeader } from '@foodflow/ui/page-header';
import { Skeleton } from '@foodflow/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiDownload, apiGet } from '@/lib/api';
import {
  exportJobStatuses,
  getExportJobsPollingInterval,
  getExportJobsQueryParams,
  type ExportJobsStatusFilter,
} from './export-jobs-config';
import { ExportJobsTable } from './export-jobs-table';

export default function ExportJobsPage() {
  const t = useTranslations('exportJobs');
  const [statusFilter, setStatusFilter] = useState<ExportJobsStatusFilter>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');
  const query = useQuery<AdminExportJobsPayload>({
    queryKey: ['export-jobs', statusFilter],
    queryFn: () => apiGet<AdminExportJobsPayload>('/admin/exports', {
      params: getExportJobsQueryParams(statusFilter),
    }),
    refetchInterval: queryState => getExportJobsPollingInterval(queryState.state.data),
  });

  const jobs = query.data?.jobs ?? [];

  const handleDownload = async (job: AdminExportJob) => {
    setDownloadingId(job.id);
    setDownloadError('');
    try {
      const blob = await apiDownload(`/admin/exports/${job.id}/download`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `foodflow-${job.resource}-${job.id.slice(0, 8)}.${job.format}`;
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      setDownloadError(error instanceof Error && error.message ? error.message : t('downloadError'));
    } finally {
      setDownloadingId(null);
    }
  };

  const isPermissionDenied = query.error instanceof ApiClientError && query.error.status === 403;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">{t('listTitle')}</CardTitle>
              <CardDescription>{t('count', { count: jobs.length })}</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as ExportJobsStatusFilter)}>
              <SelectTrigger className="w-full sm:w-40" aria-label={t('statusFilter')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportJobStatuses.map(status => (
                  <SelectItem key={status} value={status}>{t(`statuses.${status}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {downloadError && <p role="alert" className="mb-4 text-sm text-destructive">{downloadError}</p>}
          {query.isLoading ? (
            <ExportJobsSkeleton />
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
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={statusFilter === 'all' ? t('emptyTitle') : t('filteredEmptyTitle')}
              description={statusFilter === 'all' ? t('emptyDescription') : t('filteredEmptyDescription')}
            />
          ) : (
            <ExportJobsTable
              jobs={jobs}
              downloadingId={downloadingId}
              onDownload={handleDownload}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExportJobsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}
