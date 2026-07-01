'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface RevenuePoint {
  date: string;
  revenue: number;
  prevRevenue?: number;
}

interface RevenueAreaChartProps {
  data: RevenuePoint[];
  comparePeriod?: boolean;
  loading?: boolean;
}

export default function RevenueAreaChart({ data, comparePeriod, loading }: RevenueAreaChartProps) {
  if (loading) {
    return <div className="h-80 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        Chưa có dữ liệu doanh thu
      </div>
    );
  }

  return (
    <div data-testid="revenue-chart">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              try { return format(parseISO(v), 'dd/MM'); } catch { return v; }
            }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            formatter={(value: number, name: string) => {
              const label = name === 'revenue' ? 'Doanh thu' : 'Kỳ trước';
              return [formatCurrency(value), label];
            }}
            labelFormatter={(label) => {
              try { return format(parseISO(label), 'dd/MM/yyyy'); } catch { return label; }
            }}
          />
          {comparePeriod && <Legend />}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#22C55E"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#revenueGrad)"
            name="Doanh thu"
          />
          {comparePeriod && (
            <Area
              type="monotone"
              dataKey="prevRevenue"
              stroke="#94A3B8"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              fill="transparent"
              name="Kỳ trước"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
