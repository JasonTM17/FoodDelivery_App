'use client';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface RevenueSourcePieProps {
  data: { source: string; revenue: number; pct: number }[];
  className?: string;
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7'];

const SOURCE_LABELS: Record<string, string> = {
  organic: 'Tự nhiên',
  promotion: 'Khuyến mãi',
  referral: 'Giới thiệu',
  search: 'Tìm kiếm',
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{d.name}</p>
      <p className="text-sm font-bold text-gray-900">{d.value.toLocaleString('vi-VN')} VNĐ</p>
    </div>
  );
};

export function RevenueSourcePie({ data, className }: RevenueSourcePieProps) {
  const formatted = data.map((d) => ({
    ...d,
    source: SOURCE_LABELS[d.source] || d.source,
  }));

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-72 text-gray-400', className)}>
        <p className="text-sm">Chưa có dữ liệu nguồn doanh thu</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-72', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={formatted}
            cx="50%" cy="50%"
            innerRadius={50} outerRadius={90}
            paddingAngle={3}
            dataKey="revenue"
            nameKey="source"
            label={({ source, pct }) => `${source} ${(pct * 100).toFixed(0)}%`}
            labelLine={{ strokeWidth: 1 }}
          >
            {formatted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => <span className="text-sm text-gray-600">{value}</span>}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
