'use client';

import { useTranslations } from 'next-intl';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

export interface RevenueHistoryRow {
  date: string;
  revenue: number;
}

export function RestaurantFinanceRevenueHistory({ rows }: { rows: RevenueHistoryRow[] }) {
  const t = useTranslations('restaurantFinanceTab');

  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={rows} accessibilityLayer>
          <defs>
            <linearGradient id="financeRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1_000_000).toFixed(0)}M`} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [formatCurrency(value), t('revenueLabel')]}
          />
          <Area type="monotone" dataKey="revenue" stroke="#22C55E" fill="url(#financeRev)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
      <RevenueHistoryTable rows={rows} />
    </>
  );
}

function RevenueHistoryTable({ rows }: { rows: RevenueHistoryRow[] }) {
  const t = useTranslations('restaurantFinanceTab');

  return (
    <table className="sr-only">
      <caption>{t('revenueHistoryTableCaption')}</caption>
      <thead>
        <tr>
          <th>{t('revenueColumns.date')}</th>
          <th>{t('revenueColumns.revenue')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.date}>
            <td>{row.date}</td>
            <td>{formatCurrency(row.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
