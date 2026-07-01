'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@foodflow/ui/page-header';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileSpreadsheet, FileJson, FileArchive, Clock, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';

interface ExportJob {
  id: string;
  type: string;
  format: 'csv' | 'json' | 'parquet';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  rowCount?: number;
  filterSummary: Record<string, string>;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

const statusBadges: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  queued: { label: 'Đang chờ', variant: 'secondary' },
  processing: { label: 'Đang xử lý', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'default' },
  failed: { label: 'Thất bại', variant: 'destructive' },
};

const formatIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  csv: FileSpreadsheet,
  json: FileJson,
  parquet: FileArchive,
};

export default function ExportJobsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery<{ jobs: ExportJob[] }>({
    queryKey: ['export-jobs'],
    queryFn: () => apiGet('/admin/export-jobs?limit=30'),
    refetchInterval: 5000,
  });

  const jobs = data?.jobs || [];
  const filtered = statusFilter === 'all' ? jobs : jobs.filter((j) => j.status === statusFilter);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: 'Lịch sử xuất dữ liệu' }]}
        title="Lịch sử xuất dữ liệu"
        description="Theo dõi trạng thái các job xuất dữ liệu nền"
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Job xuất dữ liệu</CardTitle>
              <CardDescription>{filtered.length} job trong 30 ngày qua</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="queued">Đang chờ</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Chưa có job xuất dữ liệu nào"
              description="Dữ liệu xuất từ trang Audit sẽ hiển thị ở đây"
            />
          ) : (
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
                {filtered.map((job) => {
                  const Icon = formatIcons[job.format] || FileText;
                  const badge = statusBadges[job.status] || statusBadges.queued;
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{job.format.toUpperCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(job.filterSummary || {}).slice(0, 2).map(([k, v]) => (
                            <Badge key={k} variant="outline" className="text-[10px] py-0">
                              {k}: {v}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.rowCount != null ? job.rowCount.toLocaleString('vi-VN') : '—'}
                      </TableCell>
                      <TableCell>
                        {job.status === 'processing' ? (
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full bg-primary transition-all" style={{ width: `${job.progress}%` }} />
                          </div>
                        ) : job.status === 'completed' ? (
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full bg-green-500" style={{ width: '100%' }} />
                          </div>
                        ) : job.status === 'failed' ? (
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full bg-destructive" style={{ width: `${job.progress}%` }} />
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>
                          {job.status === 'processing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          {job.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {job.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                          {job.status === 'queued' && <Clock className="mr-1 h-3 w-3" />}
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(job.createdAt)}
                      </TableCell>
                      <TableCell>
                        {job.downloadUrl && job.status === 'completed' && (
                          <Button variant="outline" size="icon" asChild>
                            <a href={job.downloadUrl} target="_blank" rel="noopener noreferrer" download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {job.status === 'failed' && job.errorMessage && (
                          <span className="text-xs text-destructive cursor-help" title={job.errorMessage}>
                            Lỗi
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
