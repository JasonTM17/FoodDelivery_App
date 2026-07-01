'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Download, FileSpreadsheet, FileJson, FileArchive, Loader2, CheckCircle } from 'lucide-react';

type ExportFormat = 'csv' | 'json' | 'parquet';

interface AuditFilter {
  actor?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  targetType?: string;
}

interface AuditExportDialogProps {
  activeFilter: AuditFilter;
  estimatedRowCount: number;
  onExport: (format: ExportFormat, includeMetadata: boolean) => Promise<{ jobId: string }>;
  className?: string;
}

const formats: { value: ExportFormat; label: string; ext: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'csv', label: 'CSV', ext: '.csv', icon: FileSpreadsheet },
  { value: 'json', label: 'JSON', ext: '.json', icon: FileJson },
  { value: 'parquet', label: 'Parquet', ext: '.parquet', icon: FileArchive },
];

export default function AuditExportDialog({
  activeFilter,
  estimatedRowCount,
  onExport,
  className,
}: AuditExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      await onExport(format, includeMetadata);
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 2000);
    } catch (err) {
      setExportError((err as { message?: string }).message || 'Không thể tạo job xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  const activeFilters = Object.entries(activeFilter).filter(([, v]) => v !== undefined && v !== '');

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDone(false); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="mr-2 h-4 w-4" />
          Xuất dữ liệu
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Xuất nhật ký hệ thống</DialogTitle>
          <DialogDescription>
            Dữ liệu được xuất với bộ lọc hiện tại
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Định dạng xuất</Label>
            <div className="grid grid-cols-3 gap-2">
              {formats.map((f) => {
                const Icon = f.icon;
                const isParquetDisabled = f.value === 'parquet';
                return (
                  <button
                    key={f.value}
                    type="button"
                    disabled={isParquetDisabled}
                    onClick={() => setFormat(f.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors',
                      format === f.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted hover:border-primary/50',
                      isParquetDisabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{f.label}</span>
                    <span className="text-[10px] text-muted-foreground">{f.ext}</span>
                    {isParquetDisabled && (
                      <span className="text-[10px] text-muted-foreground">Sắp có</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-1" data-testid="filter-preview">
            <p className="text-xs font-medium text-muted-foreground">Bộ lọc hiện tại</p>
            {activeFilters.length === 0 ? (
              <p className="text-sm">Tất cả bản ghi (không lọc)</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {activeFilters.map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-sm font-medium">
              Dự kiến: <span className="text-primary">{estimatedRowCount.toLocaleString('vi-VN')} dòng</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-metadata"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="include-metadata" className="text-sm cursor-pointer">
              Bao gồm metadata (IP, User Agent, Correlation ID)
            </Label>
          </div>

          {estimatedRowCount > 10000 && (
            <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
              Dữ liệu lớn ({'>'} 10K dòng). Quá trình xuất sẽ chạy nền và thông báo khi hoàn tất.
            </div>
          )}
        </div>

        {exportError && (
          <p className="text-sm text-destructive">{exportError}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleExport} disabled={exporting || done}>
            {exporting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xuất...</>
            ) : done ? (
              <><CheckCircle className="mr-2 h-4 w-4" /> Đã tạo job</>
            ) : (
              'Bắt đầu xuất'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
