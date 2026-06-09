'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';

interface PaymentMethodBarProps {
  data: { method: string; revenue: number; orders: number }[];
  className?: string;
}

const METHOD_LABELS: Record<string, string> = {
  cod: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'Momo',
  zalopay: 'ZaloPay',
  vnpay: 'VNPay',
  card: 'Thẻ',
};

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name === 'Doanh thu' ? formatCurrency(p.value) : `${p.value} đơn`}
        </p>
      ))}
    </div>
  );
};

export function PaymentMethodBar({ data, className }: PaymentMethodBarProps) {
  const formatted = data.map((d) => ({
    ...d,
    method: METHOD_LABELS[d.method] || d.method,
  }));

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-72 text-gray-400', className)}>
        <p className="text-sm">Chưa có dữ liệu thanh toán</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-72', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="method" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => <span className="text-sm text-gray-600">{value}</span>}
            iconType="rect"
          />
          <Bar dataKey="revenue" name="Doanh thu" fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={48} />
          <Bar dataKey="orders" name="Đơn hàng" fill={COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
