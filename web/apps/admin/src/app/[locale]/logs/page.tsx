'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Download, FileText, RefreshCw } from 'lucide-react';
import { apiDownload, apiGetEnvelope } from '@/lib/api';
import type { AuditLogEntry, AuditLogFilters } from '@/components/audit/audit-log-types';
import { AuditLogFilterBar } from '@/components/audit/audit-log-filter-bar';
import { AuditLogTable } from '@/components/audit/audit-log-table';
import { PageHeader } from '@/components/layout/admin-page-header';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Skeleton } from '@foodflow/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PAGE_SIZE = 20;
const emptyFilters: AuditLogFilters = { actor: '', action: '', dateFrom: '', dateTo: '' };

function toQueryParams(filters: AuditLogFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== ''),
  );
}

export default function AuditLogsPage() {
  const t = useTranslations('logs');
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const query = useQuery({
    queryKey: ['audit-logs', appliedFilters, page],
    queryFn: () => apiGetEnvelope<AuditLogEntry[]>('/admin/audit-logs', {
      params: { ...toQueryParams(appliedFilters), page, limit: PAGE_SIZE },
    }),
  });
  const logs = query.data?.data ?? [];
  const total = query.data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const exportCsv = async () => {
    setExporting(true);
    setExportError('');
    try {
      const blob = await apiDownload('/admin/audit-logs/export', {
        params: toQueryParams(appliedFilters),
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `foodflow-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      setExportError(error instanceof Error && error.message ? error.message : t('exportError'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={exporting || total === 0}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? t('exporting') : t('exportCsv')}
          </Button>
        }
      />

      <AuditLogFilterBar
        value={draftFilters}
        onChange={setDraftFilters}
        onSubmit={applyFilters}
        disabled={query.isFetching}
      />

      {exportError && <p role="alert" className="text-sm text-destructive">{exportError}</p>}
      {query.isLoading ? (
        <Card><CardContent className="space-y-3 p-6">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
        </CardContent></Card>
      ) : query.isError ? (
        <EmptyState
          icon={RefreshCw}
          title={t('loadError')}
          description={t('loadErrorDescription')}
          actionLabel={t('retry')}
          onAction={() => query.refetch()}
        />
      ) : logs.length === 0 ? (
        <EmptyState icon={FileText} title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <AuditLogTable logs={logs} />
      )}

      {!query.isLoading && !query.isError && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            aria-label={t('previousPage')}
            variant="outline"
            size="icon"
            onClick={() => setPage(current => Math.max(1, current - 1))}
            disabled={page === 1}
          ><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">{t('page', { page, totalPages })}</span>
          <Button
            aria-label={t('nextPage')}
            variant="outline"
            size="icon"
            onClick={() => setPage(current => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
          ><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
