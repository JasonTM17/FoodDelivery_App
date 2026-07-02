'use client';

import { ApiClientError, type AdminExportJob } from '@foodflow/api-client';
import { CheckCircle, Clock, Download, FileText, Loader2, RefreshCw, ShieldX, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Skeleton } from '@foodflow/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { exportFormats, statusBadgeVariants } from './report-export-config';

interface RecentReportListProps {
  jobs: AdminExportJob[];
  isLoading: boolean;
  error: Error | null;
  downloadingId: string | null;
  downloadError: string;
  onRetry: () => void;
  onDownload: (job: AdminExportJob) => void;
}

export function RecentReportList(props: RecentReportListProps) {
  const t = useTranslations('reports');
  const locale = useLocale();

  if (props.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (props.error instanceof ApiClientError && props.error.status === 403) {
    return (
      <EmptyState
        icon={ShieldX}
        title={t('permissionDenied')}
        description={t('permissionDeniedDescription')}
      />
    );
  }

  if (props.error) {
    return (
      <EmptyState
        icon={RefreshCw}
        title={t('loadError')}
        description={t('loadErrorDescription')}
        actionLabel={t('retry')}
        onAction={props.onRetry}
      />
    );
  }

  if (props.jobs.length === 0) {
    return <EmptyState icon={FileText} title={t('emptyTitle')} description={t('emptyDescription')} />;
  }

  return (
    <div className="space-y-2">
      {props.downloadError && <p role="alert" className="text-sm text-destructive">{props.downloadError}</p>}
      {props.jobs.map(job => (
        <ReportRow
          key={job.id}
          job={job}
          locale={locale}
          isDownloading={props.downloadingId === job.id}
          downloadDisabled={props.downloadingId !== null}
          onDownload={props.onDownload}
        />
      ))}
    </div>
  );
}

function ReportRow({
  job,
  locale,
  isDownloading,
  downloadDisabled,
  onDownload,
}: {
  job: AdminExportJob;
  locale: string;
  isDownloading: boolean;
  downloadDisabled: boolean;
  onDownload: (job: AdminExportJob) => void;
}) {
  const t = useTranslations('reports');
  const FormatIcon = exportFormats.find(option => option.value === job.format)?.icon ?? FileText;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <FormatIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {t(`resources.${job.resource}`)} — {job.format.toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('rowCount', { count: job.rowCount })} · {formatLocalizedDate(job.createdAt, locale)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <StatusIcon status={job.status} />
        <Badge variant={statusBadgeVariants[job.status]}>{t(`statuses.${job.status}`)}</Badge>
        {job.downloadUrl && job.status === 'completed' && (
          <Button
            variant="outline"
            size="sm"
            disabled={downloadDisabled}
            aria-label={t('downloadLabel', { id: job.id.slice(0, 8) })}
            onClick={() => onDownload(job)}
          >
            {isDownloading
              ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              : <Download className="mr-1 h-3.5 w-3.5" />}
            {t('download')}
          </Button>
        )}
        {job.status === 'failed' && job.errorMessage && (
          <span className="text-xs text-destructive" title={job.errorMessage}>{t('failedLabel')}</span>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: AdminExportJob['status'] }) {
  if (status === 'running') return <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === 'completed') return <CheckCircle aria-hidden="true" className="h-4 w-4 text-green-500" />;
  if (status === 'queued') return <Clock aria-hidden="true" className="h-4 w-4 text-muted-foreground" />;
  if (status === 'failed') return <XCircle aria-hidden="true" className="h-4 w-4 text-destructive" />;
  return null;
}

function formatLocalizedDate(dateString: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}
