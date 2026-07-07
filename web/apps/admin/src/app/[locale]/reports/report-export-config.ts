import type {
  AdminExportFormat,
  AdminExportJobsPayload,
  AdminExportResource,
  AdminExportStatus,
  CreateAdminExportRequest,
} from '@foodflow/api-client';
import { FileSpreadsheet, FileText } from 'lucide-react';

export type AdminExportPeriod = NonNullable<CreateAdminExportRequest['period']>;

export const reportTypes: AdminExportResource[] = [
  'revenue',
  'orders',
  'users',
  'drivers',
  'restaurants',
  'promotions',
];

export const datePresets: AdminExportPeriod[] = [
  'today',
  '7d',
  '30d',
  'thisMonth',
  'thisQuarter',
  'custom',
];

export const exportFormats: Array<{
  value: AdminExportFormat;
  icon: typeof FileText;
}> = [
  { value: 'csv', icon: FileSpreadsheet },
  { value: 'xlsx', icon: FileText },
];

export const statusBadgeVariants: Record<
  AdminExportStatus,
  'secondary' | 'default' | 'destructive'
> = {
  queued: 'secondary',
  running: 'default',
  completed: 'default',
  failed: 'destructive',
  cancelled: 'secondary',
};

export type CustomDateRangeError = 'required' | 'invalid' | null;

export function validateCustomDateRange(
  period: AdminExportPeriod,
  dateFrom: string,
  dateTo: string,
): CustomDateRangeError {
  if (period !== 'custom') return null;
  if (!dateFrom || !dateTo) return 'required';
  if (dateFrom > dateTo) return 'invalid';
  return null;
}

export function getExportPollingInterval(data?: AdminExportJobsPayload): number | false {
  const hasPendingJob = data?.jobs.some(job => job.status === 'queued' || job.status === 'running');
  return hasPendingJob ? 5_000 : false;
}
