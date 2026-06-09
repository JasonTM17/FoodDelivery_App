'use client';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface OrderSourcePieProps {
  data: { source: string; count: number }[];
  className?: string;
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b'];

const SOURCE_LABELS: Record<string, string> = {
  app: 'App',
  web: 'Web',
  call: 'Gọi điện',
  walkin: 'Tại chỗ',
  third_party: 'Đối tác',
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = payload.reduce((s, p) => s + p.value, 0);
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{d.name}</p>
      <p className="text-sm font-bold text-gray-900">{d.value} đơn</p>
      <p className="text-xs text-gray-400">{pct}%</p>
    </div>
  );
};

export function OrderSourcePie({ data, className }: OrderSourcePieProps) {
  const formatted = data.map((d) => ({
    ...d,
    source: SOURCE_LABELS[d.source] || d.source,
  }));

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
            data={formatted}
            cx="50%" cy="50%"
            outerRadius={90}
            paddingAngle={3}
            dataKey="count"
            nameKey="source"
            label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ strokeWidth: 1 }}
          >
            {formatted.map((_, i) => (
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
