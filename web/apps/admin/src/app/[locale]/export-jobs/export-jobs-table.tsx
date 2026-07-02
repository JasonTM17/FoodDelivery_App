'use client';

import type { AdminExportJob } from '@foodflow/api-client';
import { CheckCircle, Clock, Download, FileText, Loader2, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  exportJobFilterKeys,
  exportJobFormatIcons,
  exportJobStatusVariants,
} from './export-jobs-config';

interface ExportJobsTableProps {
  jobs: AdminExportJob[];
  downloadingId: string | null;
  onDownload: (job: AdminExportJob) => void;
}

export function ExportJobsTable({ jobs, downloadingId, onDownload }: ExportJobsTableProps) {
  const t = useTranslations('exportJobs');

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">{t('columns.jobId')}</TableHead>
            <TableHead className="whitespace-nowrap">{t('columns.format')}</TableHead>
            <TableHead className="hidden whitespace-nowrap min-[1600px]:table-cell">{t('columns.filters')}</TableHead>
            <TableHead className="whitespace-nowrap">{t('columns.rows')}</TableHead>
            <TableHead className="whitespace-nowrap">{t('columns.progress')}</TableHead>
            <TableHead className="whitespace-nowrap">{t('columns.status')}</TableHead>
            <TableHead className="hidden whitespace-nowrap min-[1400px]:table-cell">{t('columns.createdAt')}</TableHead>
            <TableHead className="w-24"><span className="sr-only">{t('columns.actions')}</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map(job => (
            <ExportJobsRow
              key={job.id}
              job={job}
              isDownloading={downloadingId === job.id}
              downloadDisabled={downloadingId !== null}
              onDownload={onDownload}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExportJobsRow({
  job,
  isDownloading,
  downloadDisabled,
  onDownload,
}: {
  job: AdminExportJob;
  isDownloading: boolean;
  downloadDisabled: boolean;
  onDownload: (job: AdminExportJob) => void;
}) {
  const t = useTranslations('exportJobs');
  const locale = useLocale();
  const Icon = exportJobFormatIcons[job.format] ?? FileText;

  return (
    <TableRow>
      <TableCell className="font-mono text-xs tabular-nums">{job.id.slice(0, 8)}</TableCell>
      <TableCell><Icon aria-hidden="true" className="mr-1.5 inline h-4 w-4 text-muted-foreground" />{job.format.toUpperCase()}</TableCell>
      <TableCell className="hidden min-[1600px]:table-cell"><FilterBadges filters={job.filterSummary} /></TableCell>
      <TableCell className="text-sm tabular-nums">{job.rowCount.toLocaleString(locale)}</TableCell>
      <TableCell><ProgressPill status={job.status} progress={job.progress} /></TableCell>
      <TableCell>
        <Badge className="whitespace-nowrap" variant={exportJobStatusVariants[job.status]}>
          <StatusIcon status={job.status} />
          {t(`statuses.${job.status}`)}
        </Badge>
      </TableCell>
      <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground tabular-nums min-[1400px]:table-cell">
        {formatLocalizedDate(job.createdAt, locale)}
      </TableCell>
      <TableCell>
        {job.downloadUrl && job.status === 'completed' && (
          <Button
            variant="outline"
            size="icon"
            disabled={downloadDisabled}
            aria-label={t('downloadLabel', { id: job.id.slice(0, 8) })}
            onClick={() => onDownload(job)}
          >
            {isDownloading
              ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              : <Download className="h-4 w-4" />}
          </Button>
        )}
        {job.status === 'failed' && job.errorMessage && (
          <span className="text-xs text-destructive" title={job.errorMessage} aria-label={job.errorMessage}>
            {t('failedLabel')}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function FilterBadges({ filters }: { filters: Record<string, string> }) {
  const t = useTranslations('exportJobs');
  const entries = Object.entries(filters).slice(0, 2);
  if (entries.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="outline" className="py-0 text-[10px]">
          {isKnownFilterKey(key) ? t(`filterKeys.${key}`) : key}: {value}
        </Badge>
      ))}
    </div>
  );
}

function isKnownFilterKey(key: string): key is typeof exportJobFilterKeys[number] {
  return exportJobFilterKeys.some(candidate => candidate === key);
}

function ProgressPill({ status, progress }: { status: AdminExportJob['status']; progress: number }) {
  const t = useTranslations('exportJobs');
  if (status === 'queued' || status === 'cancelled') return <span className="text-muted-foreground">—</span>;
  const value = status === 'completed' ? 100 : Math.max(0, Math.min(progress, 100));
  const color = status === 'failed' ? 'bg-destructive' : status === 'completed' ? 'bg-green-500' : 'bg-primary';

  return (
    <div
      role="progressbar"
      aria-label={t('progressLabel')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary"
    >
      <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function StatusIcon({ status }: { status: AdminExportJob['status'] }) {
  if (status === 'running') return <Loader2 aria-hidden="true" className="mr-1 h-3 w-3 animate-spin motion-reduce:animate-none" />;
  if (status === 'completed') return <CheckCircle aria-hidden="true" className="mr-1 h-3 w-3" />;
  if (status === 'failed') return <XCircle aria-hidden="true" className="mr-1 h-3 w-3" />;
  if (status === 'queued') return <Clock aria-hidden="true" className="mr-1 h-3 w-3" />;
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
