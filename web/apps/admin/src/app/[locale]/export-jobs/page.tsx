'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiDownload, apiGet } from '@/lib/api';
import { PageHeader } from '@foodflow/ui/page-header';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, XCircle } from 'lucide-react';
import { ExportJobsTable, type ExportJob } from './export-jobs-table';

const statusFilters = [
  { value: 'all', label: 'Tất cả' },
  { value: 'queued', label: 'Đang chờ' },
  { value: 'running', label: 'Đang xử lý' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function ExportJobsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isError, isLoading, refetch } = useQuery<{ jobs: ExportJob[] }>({
    queryKey: ['export-jobs'],
    queryFn: () => apiGet('/admin/exports?limit=30'),
    refetchInterval: 5000,
  });

  const jobs = data?.jobs ?? [];
  const filtered = statusFilter === 'all' ? jobs : jobs.filter(job => job.status === statusFilter);

  const handleDownload = async (job: ExportJob) => {
    setDownloadingId(job.id);
    try {
      const blob = await apiDownload(`/admin/exports/${job.id}/download`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `foodflow-${job.resource || job.type}-${job.id.slice(0, 8)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) return <ExportJobsSkeleton />;

  if (isError) {
    return (
      <EmptyState
        icon={XCircle}
        title="Không thể tải lịch sử xuất dữ liệu"
        description="Kiểm tra kết nối hoặc thử lại sau vài giây."
        actionLabel="Thử lại"
        onAction={() => refetch()}
      />
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
              <CardDescription>{filtered.length} job gần nhất</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusFilters.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Chưa có job xuất dữ liệu nào"
              description="Dữ liệu xuất từ Reports hoặc Audit sẽ hiển thị ở đây."
            />
          ) : (
            <ExportJobsTable jobs={filtered} downloadingId={downloadingId} onDownload={handleDownload} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExportJobsSkeleton() {
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
