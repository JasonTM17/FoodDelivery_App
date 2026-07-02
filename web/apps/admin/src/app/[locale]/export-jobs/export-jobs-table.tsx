import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, Clock, Download, FileText, Loader2, XCircle } from 'lucide-react';
import { exportJobFormatIcons, exportJobStatusBadges } from './export-jobs-config';

export interface ExportJob {
  id: string;
  type: string;
  resource: string;
  format: 'csv' | 'xlsx' | 'parquet';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  rowCount?: number;
  filterSummary: Record<string, string>;
  createdAt: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export function ExportJobsTable({
  jobs,
  downloadingId,
  onDownload,
}: {
  jobs: ExportJob[];
  downloadingId: string | null;
  onDownload: (job: ExportJob) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job ID</TableHead>
          <TableHead>Định dạng</TableHead>
          <TableHead>Bộ lọc</TableHead>
          <TableHead>Số dòng</TableHead>
          <TableHead>Tiến độ</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày tạo</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map(job => (
          <ExportJobsRow key={job.id} job={job} isDownloading={downloadingId === job.id} onDownload={onDownload} />
        ))}
      </TableBody>
    </Table>
  );
}

function ExportJobsRow({
  job,
  isDownloading,
  onDownload,
}: {
  job: ExportJob;
  isDownloading: boolean;
  onDownload: (job: ExportJob) => void;
}) {
  const Icon = exportJobFormatIcons[job.format] || FileText;
  const badge = exportJobStatusBadges[job.status] || exportJobStatusBadges.queued;

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}</TableCell>
      <TableCell><Icon className="mr-1.5 inline h-4 w-4 text-muted-foreground" />{job.format.toUpperCase()}</TableCell>
      <TableCell><FilterBadges filters={job.filterSummary || {}} /></TableCell>
      <TableCell className="text-sm">{job.rowCount != null ? job.rowCount.toLocaleString('vi-VN') : '—'}</TableCell>
      <TableCell><ProgressPill status={job.status} progress={job.progress} /></TableCell>
      <TableCell><StatusBadge status={job.status} label={badge.label} variant={badge.variant} /></TableCell>
      <TableCell className="text-xs text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
      <TableCell>
        {job.downloadUrl && job.status === 'completed' && (
          <Button variant="outline" size="icon" disabled={isDownloading} onClick={() => onDownload(job)}>
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
        )}
        {job.status === 'failed' && job.errorMessage && (
          <span className="text-xs text-destructive" title={job.errorMessage}>Lỗi</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function FilterBadges({ filters }: { filters: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(filters).slice(0, 2).map(([key, value]) => (
        <Badge key={key} variant="outline" className="py-0 text-[10px]">{key}: {value}</Badge>
      ))}
    </div>
  );
}

function ProgressPill({ status, progress }: { status: ExportJob['status']; progress: number }) {
  const value = status === 'completed' ? 100 : progress;
  const color = status === 'failed' ? 'bg-destructive' : status === 'completed' ? 'bg-green-500' : 'bg-primary';
  if (status === 'queued' || status === 'cancelled') return null;
  return <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary"><div className={`h-full ${color}`} style={{ width: `${value}%` }} /></div>;
}

function StatusBadge({ status, label, variant }: { status: ExportJob['status']; label: string; variant: 'secondary' | 'default' | 'destructive' }) {
  return (
    <Badge variant={variant}>
      {status === 'running' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
      {status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
      {status === 'queued' && <Clock className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}
