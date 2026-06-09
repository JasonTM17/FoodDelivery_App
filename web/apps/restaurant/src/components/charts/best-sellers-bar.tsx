'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';

interface BestSellersBarProps {
  data: { name: string; quantity: number; revenue: number }[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name === 'quantity' ? `${p.value} đơn` : formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export function BestSellersBar({ data, className }: BestSellersBarProps) {
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
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
          <YAxis
            type="category" dataKey="name" width={120}
            axisLine={false} tickLine={false}
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" fill="#f97316" radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
