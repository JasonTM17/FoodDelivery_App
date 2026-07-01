'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface OrderStatusPoint {
  date: string;
  pending: number;
  confirmed: number;
  delivering: number;
  completed: number;
  cancelled: number;
}

interface OrderStatusStackedBarProps {
  data: OrderStatusPoint[];
  loading?: boolean;
}

const barConfig = [
  { key: 'completed', label: 'Đã giao', color: '#22C55E' },
  { key: 'delivering', label: 'Đang giao', color: '#3B82F6' },
  { key: 'confirmed', label: 'Đã xác nhận', color: '#F59E0B' },
  { key: 'pending', label: 'Chờ xác nhận', color: '#94A3B8' },
  { key: 'cancelled', label: 'Đã hủy', color: '#EF4444' },
];

export default function OrderStatusStackedBar({ data, loading }: OrderStatusStackedBarProps) {
  if (loading) {
    return <div className="h-80 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        Chưa có dữ liệu đơn hàng
      </div>
    );
  }

  return (
    <div data-testid="order-status-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
          <Legend />
          {barConfig.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} stackId="a" fill={bar.color} name={bar.label} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
