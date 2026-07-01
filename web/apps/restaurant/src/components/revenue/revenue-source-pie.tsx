'use client';

import { formatCurrency } from '@/lib/utils';

interface RevenueSourcePieProps {
  data: { source: string; vnd: number; pct: number }[];
}

const COLORS: Record<string, string> = {
  organic: '#10B981',
  promotion: '#F97316',
  referral: '#8B5CF6',
  search: '#3B82F6',
};

const LABELS: Record<string, string> = {
  organic: 'Tự nhiên',
  promotion: 'Khuyến mãi',
  referral: 'Giới thiệu',
  search: 'Tìm kiếm',
};

export function RevenueSourcePie({ data }: RevenueSourcePieProps) {
  const total = data.reduce((s, d) => s + d.vnd, 0) || 1;

  return (
    <div className="space-y-3" data-testid="revenue-source-pie">
      <h4 className="text-sm font-semibold text-gray-900">Nguồn đơn hàng</h4>

      <div className="grid grid-cols-2 gap-3">
        {data.map((d) => (
          <div key={d.source} className="flex items-center gap-3 rounded-lg border p-3">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: COLORS[d.source] || '#6B7280' }}
            >
              {LABELS[d.source]?.charAt(0) || d.source.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{LABELS[d.source] || d.source}</p>
              <p className="text-xs text-gray-500">{formatCurrency(d.vnd)} · {d.pct}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
