'use client';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';

interface CategoryMixDonutProps {
  data: { category: string; count: number; revenue: number }[];
  className?: string;
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { revenue: number } }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{d.name}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(d.payload.revenue)}</p>
      <p className="text-xs text-gray-400">{d.value} đơn</p>
    </div>
  );
};

export function CategoryMixDonut({ data, className }: CategoryMixDonutProps) {
  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-gray-400', className)}>
        <p className="text-sm">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-72', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={60} outerRadius={90}
            paddingAngle={3}
            dataKey="count"
            nameKey="category"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
