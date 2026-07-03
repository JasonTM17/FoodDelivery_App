'use client';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
  const t = useTranslations('overviewCharts');

  if (loading) {
    return <div role="status" aria-label={t('loading')} className="h-80 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data?.length) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        {t('empty.restaurants')}
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
            tickFormatter={(value) => `${(value / 1_000_000).toFixed(0)}M`}
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
            formatter={(value: number) => [formatCurrency(value), t('series.revenue')]}
          />
          <Bar dataKey="revenue" name={t('series.revenue')} radius={[0, 4, 4, 0]}>
            {reversed.map((restaurant) => (
              <Cell key={restaurant.id} fill="#22C55E" opacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <table className="sr-only">
        <caption>{t('tables.restaurantsCaption')}</caption>
        <thead>
          <tr>
            <th>{t('tables.restaurant')}</th>
            <th>{t('tables.revenue')}</th>
            <th>{t('tables.orders')}</th>
            <th>{t('tables.rating')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((restaurant) => (
            <tr key={restaurant.id}>
              <td>{restaurant.name}</td>
              <td>{formatCurrency(restaurant.revenue)}</td>
              <td>{restaurant.orderCount}</td>
              <td>{restaurant.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
