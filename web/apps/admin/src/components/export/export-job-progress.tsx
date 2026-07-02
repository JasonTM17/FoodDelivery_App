'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

interface ExportJob {
  id: string;
  status: 'queued' | 'running' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalRows?: number;
  processedRows?: number;
  errorMessage?: string;
}

interface ExportJobProgressProps {
  job: ExportJob;
  estimatedRowCount?: number;
  onCancel?: () => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  queued: { label: 'queued', variant: 'secondary' },
  running: { label: 'running', variant: 'default' },
  processing: { label: 'running', variant: 'default' },
  completed: { label: 'completed', variant: 'default' },
  failed: { label: 'failed', variant: 'destructive' },
  cancelled: { label: 'cancelled', variant: 'secondary' },
};

export default function ExportJobProgress({
  job,
  estimatedRowCount,
  onCancel,
  className,
}: ExportJobProgressProps) {
  const locale = useLocale();
  const t = useTranslations('exportJobs');
  const badge = statusConfig[job.status] || statusConfig.queued;
  const localeTag = locale === 'ja' ? 'ja-JP' : locale === 'en' ? 'en-US' : 'vi-VN';

  return (
    <div className={cn('space-y-3 rounded-lg border p-4', className)} data-testid="export-job-progress">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Job #{job.id.slice(0, 8)}</span>
          <Badge variant={badge.variant}>{t(`statuses.${badge.label}`)}</Badge>
        </div>
        {(job.status === 'processing' || job.status === 'running') && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {(job.status === 'processing' || job.status === 'running') && (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {job.totalRows
                ? t('processedRowsWithTotal', {
                    processed: (job.processedRows ?? 0).toLocaleString(localeTag),
                    total: job.totalRows.toLocaleString(localeTag),
                  })
                : t('processedRows', { processed: (job.processedRows ?? 0).toLocaleString(localeTag) })}
            </span>
            <span>{job.progress}%</span>
          </div>
        </>
      )}

      {job.status === 'queued' && estimatedRowCount && (
        <p className="text-xs text-muted-foreground">
          {t('estimatedRows', { count: estimatedRowCount.toLocaleString(localeTag) })}
        </p>
      )}

      {job.status === 'failed' && job.errorMessage && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          <XCircle className="h-3.5 w-3.5" />
          {job.errorMessage}
        </div>
      )}

      {(job.status === 'queued' || job.status === 'processing') && onCancel && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            {t('cancel')}
          </Button>
        </div>
      )}
    </div>
  );
}
