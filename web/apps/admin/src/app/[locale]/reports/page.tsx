'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiDownload, apiGet, apiPost } from '@/lib/api';
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
import { CheckCircle, Clock, Download, FileText, Loader2 } from 'lucide-react';
import { datePresets, exportFormats, reportTypes, statusBadges } from './report-export-config';

interface RecentReport {
  id: string;
  type: string;
  format: 'csv' | 'xlsx' | 'parquet';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  downloadUrl?: string;
  rowCount?: number;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('revenue');
  const [period, setPeriod] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState('csv');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const { data: recentReports, isLoading: loadingRecent, refetch } = useQuery<{ jobs: RecentReport[] }>({
    queryKey: ['report-jobs'],
    queryFn: () => apiGet('/admin/exports?limit=20'),
    refetchInterval: 5000,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError('');
    try {
      await apiPost('/admin/exports', {
        resource: reportType,
        period,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        format,
      });
      await refetch();
    } catch (err) {
      setGenerateError((err as { message?: string }).message || 'Không thể tạo báo cáo');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: RecentReport) => {
    const blob = await apiDownload(`/admin/exports/${report.id}/download`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `foodflow-${report.type}-${report.id.slice(0, 8)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: 'Báo cáo & Xuất dữ liệu' }]}
        title="Báo cáo & Xuất dữ liệu"
        description="Tạo và tải xuống báo cáo dữ liệu từ export service chuẩn"
      />

      <Card>
        <CardHeader>
          <CardTitle>Tạo báo cáo mới</CardTitle>
          <CardDescription>Chọn loại báo cáo, khoảng thời gian và định dạng xuất</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField label="Loại báo cáo" value={reportType} onValueChange={setReportType} options={reportTypes} />
            <SelectField label="Khoảng thời gian" value={period} onValueChange={setPeriod} options={datePresets} />
            {period === 'custom' && (
              <>
                <DateField label="Từ ngày" value={dateFrom} onChange={setDateFrom} />
                <DateField label="Đến ngày" value={dateTo} onChange={setDateTo} />
              </>
            )}
            <SelectField label="Định dạng" value={format} onValueChange={setFormat} options={exportFormats} />
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
          {generateError && <p className="text-sm text-destructive">{generateError}</p>}
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
          ) : !recentReports?.jobs?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có báo cáo nào</p>
          ) : (
            <div className="space-y-2">
              {recentReports.jobs.map(report => (
                <ReportRow key={report.id} report={report} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="date" value={value} onChange={event => onChange(event.target.value)} />
    </div>
  );
}

function ReportRow({ report, onDownload }: { report: RecentReport; onDownload: (report: RecentReport) => void }) {
  const FormatIcon = exportFormats.find(format => format.value === report.format)?.icon || FileText;
  const badge = statusBadges[report.status] || statusBadges.queued;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <FormatIcon className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">
            {reportTypes.find(type => type.value === report.type)?.label || report.type} — {report.format.toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            {report.rowCount != null ? `${report.rowCount} dòng · ` : ''}{formatDate(report.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {report.status === 'running' ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : report.status === 'completed' ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : report.status === 'queued' ? (
          <Clock className="h-4 w-4 text-muted-foreground" />
        ) : null}
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {report.downloadUrl && report.status === 'completed' && (
          <Button variant="outline" size="sm" onClick={() => onDownload(report)}>
            <Download className="mr-1 h-3.5 w-3.5" />
            Tải
          </Button>
        )}
      </div>
    </div>
  );
}
