'use client';

import { useTranslations } from 'next-intl';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

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
  const t = useTranslations('overviewCharts');

  if (loading) {
    return <div role="status" aria-label={t('loading')} className="h-80 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data?.length) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        {t('empty.drivers')}
      </div>
    );
  }

  const hasPayout = data.some((point) => point.avgPayout != null);

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
            tickFormatter={(hour) => `${hour}h`}
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
              const isDriverCount = name === 'count' || name === t('series.onlineDrivers');
              return [
                isDriverCount ? value : formatCurrency(value),
                isDriverCount ? t('series.onlineDrivers') : t('series.avgPayout'),
              ];
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
            name={t('series.onlineDrivers')}
          />
          {hasPayout && (
            <Line
              type="monotone"
              dataKey="avgPayout"
              stroke="#94A3B8"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name={t('series.avgPayout')}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <table className="sr-only">
        <caption>{t('tables.driverCaption')}</caption>
        <thead>
          <tr>
            <th>{t('tables.hour')}</th>
            <th>{t('tables.onlineDrivers')}</th>
            {hasPayout && <th>{t('tables.avgPayout')}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.hour}>
              <td>{point.hour}:00</td>
              <td>{point.count}</td>
              {hasPayout && <td>{point.avgPayout == null ? '—' : formatCurrency(point.avgPayout)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
