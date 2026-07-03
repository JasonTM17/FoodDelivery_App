'use client';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
  { key: 'completed', color: '#22C55E' },
  { key: 'delivering', color: '#3B82F6' },
  { key: 'confirmed', color: '#F59E0B' },
  { key: 'pending', color: '#94A3B8' },
  { key: 'cancelled', color: '#EF4444' },
] as const;

export default function OrderStatusStackedBar({ data, loading }: OrderStatusStackedBarProps) {
  const t = useTranslations('overviewCharts');

  if (loading) {
    return <div role="status" aria-label={t('loading')} className="h-80 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data?.length) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        {t('empty.orders')}
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
            <Bar
              key={bar.key}
              dataKey={bar.key}
              stackId="orders"
              fill={bar.color}
              name={t(`statuses.${bar.key}`)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <table className="sr-only">
        <caption>{t('tables.orderStatusCaption')}</caption>
        <thead>
          <tr>
            <th>{t('tables.date')}</th>
            {barConfig.map((bar) => <th key={bar.key}>{t(`statuses.${bar.key}`)}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              {barConfig.map((bar) => <td key={bar.key}>{point[bar.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
