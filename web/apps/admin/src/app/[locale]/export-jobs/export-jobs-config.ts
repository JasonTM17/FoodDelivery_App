import type { AdminExportJobsPayload, AdminExportStatus } from '@foodflow/api-client';
import { FileArchive, FileSpreadsheet, FileText } from 'lucide-react';

export type ExportJobsStatusFilter = 'all' | AdminExportStatus;

export const exportJobStatuses: ExportJobsStatusFilter[] = [
  'all',
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
];

export const exportJobFilterKeys = ['period', 'dateFrom', 'dateTo'] as const;

export const exportJobStatusVariants: Record<
  AdminExportStatus,
  'secondary' | 'default' | 'destructive'
> = {
  queued: 'secondary',
  running: 'default',
  completed: 'default',
  failed: 'destructive',
  cancelled: 'secondary',
};

export const exportJobFormatIcons = {
  csv: FileSpreadsheet,
  xlsx: FileText,
  parquet: FileArchive,
};

export function getExportJobsPollingInterval(data?: AdminExportJobsPayload): number | false {
  const hasPendingJob = data?.jobs.some(job => job.status === 'queued' || job.status === 'running');
  return hasPendingJob ? 5_000 : false;
}

export function getExportJobsQueryParams(status: ExportJobsStatusFilter) {
  return {
    limit: 30,
    status: status === 'all' ? undefined : status,
  };
}
