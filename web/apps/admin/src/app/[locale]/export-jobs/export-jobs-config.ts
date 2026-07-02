import { FileArchive, FileSpreadsheet, FileText } from 'lucide-react';

export const exportJobStatusBadges: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  queued: { label: 'Đang chờ', variant: 'secondary' },
  running: { label: 'Đang xử lý', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'default' },
  failed: { label: 'Thất bại', variant: 'destructive' },
  cancelled: { label: 'Đã hủy', variant: 'secondary' },
};

export const exportJobFormatIcons = {
  csv: FileSpreadsheet,
  xlsx: FileText,
  parquet: FileArchive,
};
