export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const bom = '﻿';
  const csvRows = [headers.join(','), ...rows.map((r) => r.map(quoteCSV).join(','))];
  const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function exportRevenueCSV(
  period: string,
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  },
  drillDown: { name: string; category?: string; orders: number; revenue: number; avgOrderValue: number; percentOfTotal: number }[]
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const headers = ['Mục', 'Giá trị'];
  const summaryRows = [
    ['Tổng doanh thu', summary.totalRevenue.toString()],
    ['Tổng đơn hàng', summary.totalOrders.toString()],
    ['Giá trị TB/đơn', summary.averageOrderValue.toString()],
    ['', ''],
    ['Tên', 'Danh mục', 'Đơn hàng', 'Doanh thu', 'Giá trị TB', '% Tổng'],
  ];

  const detailRows = drillDown.map((d) => [d.name, d.category ?? '', d.orders.toString(), d.revenue.toString(), d.avgOrderValue.toString(), d.percentOfTotal.toString()]);

  downloadCSV(`doanh-thu-${period}-${dateStr}.csv`, headers, summaryRows);
  // Append detail via a second call since headers differ
  const detailBlob = new Blob(['﻿' + detailRows.map((r) => r.map(quoteCSV).join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
  // Combined approach: rebuild with matching columns
  const allHeaders = ['Loại', 'Tên', 'Danh mục', 'Đơn hàng', 'Doanh thu', 'Giá trị TB', '% Tổng'];
  const allRows: string[][] = [
    ['TỔNG QUAN', '', '', summary.totalOrders.toString(), summary.totalRevenue.toString(), summary.averageOrderValue.toString(), ''],
    ...drillDown.map((d) => ['Chi tiết', d.name, d.category ?? '', d.orders.toString(), d.revenue.toString(), d.avgOrderValue.toString(), d.percentOfTotal.toString()]),
  ];
  downloadCSV(`doanh-thu-${period}-${dateStr}.csv`, allHeaders, allRows);
}

function quoteCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
