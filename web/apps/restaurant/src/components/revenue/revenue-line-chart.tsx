'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';
import type { DailyRevenue } from '@/lib/types';

interface RevenueLineChartProps {
  data: DailyRevenue[];
  type?: 'bar' | 'line';
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

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export function RevenueLineChart({ data, type = 'bar', className }: RevenueLineChartProps) {
  const formattedData = data.map((d) => ({ ...d, date: formatDateLabel(d.date) }));

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-gray-400', className)}>
        <p className="text-sm">Chưa có dữ liệu doanh thu</p>
      </div>
    );
  }

  const axisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 12, fill: '#9ca3af' },
  };

  const yAxisFormatter = (v: number) => `${(v / 1000).toFixed(0)}k`;

  return (
    <div className={cn('w-full h-72', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={formattedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={yAxisFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        ) : (
          <LineChart data={formattedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={yAxisFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
