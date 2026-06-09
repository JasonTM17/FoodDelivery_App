'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';

interface HourOfDayBarProps {
  data: { hour: number; revenue: number; orders: number }[];
  className?: string;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}h`);

function getBarColor(hour: number): string {
  if (hour >= 11 && hour <= 13) return '#f97316'; // lunch peak
  if (hour >= 18 && hour <= 21) return '#ea580c'; // dinner peak
  if (hour >= 7 && hour <= 9) return '#fdba74';   // breakfast
  return '#e5e7eb'; // off-peak
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export function HourOfDayBar({ data, className }: HourOfDayBarProps) {
  const filled = HOUR_LABELS.map((label, hour) => {
    const found = data.find((d) => d.hour === hour);
    return { hour: label, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0, fill: found ? getBarColor(hour) : '#f3f4f6' };
  });

  const maxRevenue = Math.max(...filled.map((d) => d.revenue), 1);

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-72 text-gray-400', className)}>
        <p className="text-sm">Chưa có dữ liệu theo giờ</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-72', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filled} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} interval={2} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={maxRevenue * 0.5} stroke="#9ca3af" strokeDasharray="3 3" strokeOpacity={0.3} />
          <Bar dataKey="revenue" radius={[3, 3, 0, 0]} maxBarSize={20}>
            {filled.map((entry, i) => (
              <rect key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
