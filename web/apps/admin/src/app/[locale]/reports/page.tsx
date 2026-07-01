'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiPost, apiGet } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@foodflow/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, FileJson, Clock, CheckCircle, Loader2 } from 'lucide-react';

interface RecentReport {
  id: string;
  type: string;
  format: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  downloadUrl?: string;
  rowCount?: number;
}

const reportTypes = [
  { value: 'revenue', label: 'Doanh thu' },
  { value: 'orders', label: 'Đơn hàng' },
  { value: 'users', label: 'Người dùng' },
  { value: 'drivers', label: 'Tài xế' },
  { value: 'restaurants', label: 'Nhà hàng' },
  { value: 'promotions', label: 'Khuyến mãi' },
];

const datePresets = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'thisQuarter', label: 'Quý này' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

const exportFormats = [
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { value: 'json', label: 'JSON', icon: FileJson },
  { value: 'pdf', label: 'PDF', icon: FileText },
];

const statusBadges: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'warning' }> = {
  queued: { label: 'Đang chờ', variant: 'secondary' },
  processing: { label: 'Đang xử lý', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'default' },
  failed: { label: 'Thất bại', variant: 'destructive' },
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState('revenue');
  const [period, setPeriod] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState('csv');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const { data: recentReports, isLoading: loadingRecent } = useQuery<{ reports: RecentReport[] }>({
    queryKey: ['report-jobs'],
    queryFn: () => apiGet('/admin/reports/jobs?limit=20'),
    refetchInterval: 5000,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError('');
    try {
      await apiPost('/admin/reports/generate', {
        type: reportType,
        period,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        format,
      });
    } catch (err) {
      setGenerateError((err as { message?: string }).message || 'Không thể tạo báo cáo');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: 'Báo cáo & Xuất dữ liệu' }]}
        title="Báo cáo & Xuất dữ liệu"
        description="Tạo và tải xuống các báo cáo dữ liệu"
      />

      <Card>
        <CardHeader>
          <CardTitle>Tạo báo cáo mới</CardTitle>
          <CardDescription>Chọn loại báo cáo, khoảng thời gian và định dạng xuất</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Loại báo cáo</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Khoảng thời gian</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {datePresets.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {period === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Từ ngày</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Đến ngày</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Định dạng</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {exportFormats.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" /> Tạo báo cáo</>
              )}
            </Button>
          </div>
          {generateError && (
            <p className="text-sm text-destructive">{generateError}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Báo cáo gần đây</CardTitle>
          <CardDescription>Các báo cáo được tạo trong 30 ngày qua</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !recentReports?.reports?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có báo cáo nào</p>
          ) : (
            <div className="space-y-2">
              {recentReports.reports.map((r) => {
                const FormatIcon = exportFormats.find((f) => f.value === r.format)?.icon || FileText;
                const badge = statusBadges[r.status] || statusBadges.queued;
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <FormatIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {reportTypes.find((t) => t.value === r.type)?.label || r.type} — {r.format.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.rowCount != null ? `${r.rowCount} dòng · ` : ''}{formatDate(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'processing' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : r.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : r.status === 'failed' ? (
                        <Badge variant="destructive" className="text-xs">Thất bại</Badge>
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge variant={badge.variant === 'warning' ? 'secondary' : badge.variant}>{badge.label}</Badge>
                      {r.downloadUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-1 h-3.5 w-3.5" />
                            Tải
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
