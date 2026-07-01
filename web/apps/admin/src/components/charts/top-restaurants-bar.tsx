'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface TopRestaurant {
  id: string;
  name: string;
  revenue: number;
  orderCount: number;
  rating: number;
}

interface TopRestaurantsBarProps {
  data: TopRestaurant[];
  loading?: boolean;
}

export default function TopRestaurantsBar({ data, loading }: TopRestaurantsBarProps) {
  if (loading) {
    return <div className="h-80 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        Chưa có dữ liệu nhà hàng
      </div>
    );
  }

  const reversed = [...data].reverse();

  return (
    <div data-testid="top-restaurants-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={reversed} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
              return [value, name];
            }}
          />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
            {reversed.map((entry) => (
              <Cell key={entry.id} fill="#22C55E" opacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
