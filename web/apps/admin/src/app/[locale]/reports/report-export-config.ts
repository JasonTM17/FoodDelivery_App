import { FileArchive, FileSpreadsheet, FileText } from 'lucide-react';

export const reportTypes = [
  { value: 'revenue', label: 'Doanh thu' },
  { value: 'orders', label: 'Đơn hàng' },
  { value: 'users', label: 'Người dùng' },
  { value: 'drivers', label: 'Tài xế' },
  { value: 'restaurants', label: 'Nhà hàng' },
  { value: 'promotions', label: 'Khuyến mãi' },
];

export const datePresets = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'thisQuarter', label: 'Quý này' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

export const exportFormats = [
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { value: 'xlsx', label: 'XLSX', icon: FileText },
  { value: 'parquet', label: 'Parquet', icon: FileArchive },
];

export const statusBadges: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  queued: { label: 'Đang chờ', variant: 'secondary' },
  running: { label: 'Đang xử lý', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'default' },
  failed: { label: 'Thất bại', variant: 'destructive' },
  cancelled: { label: 'Đã hủy', variant: 'secondary' },
};
