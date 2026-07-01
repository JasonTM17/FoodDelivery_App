'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
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
  queued: { label: 'Đang chờ', variant: 'secondary' },
  processing: { label: 'Đang xử lý', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'default' },
  failed: { label: 'Thất bại', variant: 'destructive' },
};

export default function ExportJobProgress({
  job,
  estimatedRowCount,
  onCancel,
  className,
}: ExportJobProgressProps) {
  const badge = statusConfig[job.status] || statusConfig.queued;

  return (
    <div className={cn('space-y-3 rounded-lg border p-4', className)} data-testid="export-job-progress">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Job #{job.id.slice(0, 8)}</span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        {job.status === 'processing' && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {job.status === 'processing' && (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {job.processedRows?.toLocaleString('vi-VN') || 0}
              {job.totalRows ? ` / ${job.totalRows.toLocaleString('vi-VN')}` : ''} dòng
            </span>
            <span>{job.progress}%</span>
          </div>
        </>
      )}

      {job.status === 'queued' && estimatedRowCount && (
        <p className="text-xs text-muted-foreground">
          Dự kiến: {estimatedRowCount.toLocaleString('vi-VN')} dòng
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
            Hủy
          </Button>
        </div>
      )}
    </div>
  );
}
