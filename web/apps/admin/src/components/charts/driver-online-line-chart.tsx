'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';

interface DriverOnlinePoint {
  hour: number;
  count: number;
  avgPayout?: number;
}

interface DriverOnlineLineChartProps {
  data: DriverOnlinePoint[];
  loading?: boolean;
}

export default function DriverOnlineLineChart({ data, loading }: DriverOnlineLineChartProps) {
  if (loading) {
    return <div className="h-80 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        Chưa có dữ liệu tài xế online
      </div>
    );
  }

  return (
    <div data-testid="driver-online-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(h) => `${h}h`}
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
            formatter={(value: number, name: string) => {
              return name === 'count' ? [value, 'Tài xế online'] : [value, 'TB thanh toán'];
            }}
            labelFormatter={(hour: number) => `${hour}h:00`}
          />
          <ReferenceArea x1={11} x2={13} fill="#22C55E" fillOpacity={0.05} />
          <ReferenceArea x1={17} x2={20} fill="#22C55E" fillOpacity={0.05} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
            name="Tài xế online"
          />
          {data[0]?.avgPayout != null && (
            <Line
              type="monotone"
              dataKey="avgPayout"
              stroke="#94A3B8"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name="TB thanh toán"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
