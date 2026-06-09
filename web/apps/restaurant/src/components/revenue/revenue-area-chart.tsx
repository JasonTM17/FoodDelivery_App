'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';

interface RevenueAreaChartProps {
  data: { date: string; revenue: number; previousRevenue?: number }[];
  className?: string;
}

function formatDateLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
  } catch {
    return dateStr;
  }
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name === 'Kỳ trước' ? 'Kỳ trước: ' : ''}{formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export function RevenueAreaChart({ data, className }: RevenueAreaChartProps) {
  const formatted = data.map((d) => ({ ...d, date: formatDateLabel(d.date) }));

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-72 text-gray-400', className)}>
        <p className="text-sm">Chưa có dữ liệu doanh thu</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-72', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="prevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => <span className="text-sm text-gray-600">{value}</span>}
            iconType="line"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Kỳ này"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            activeDot={{ r: 5 }}
          />
          {formatted.some((d) => d.previousRevenue != null) && (
            <Area
              type="monotone"
              dataKey="previousRevenue"
              name="Kỳ trước"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#prevGradient)"
              activeDot={{ r: 4 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
