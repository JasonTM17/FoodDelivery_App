'use client';

import { useTranslations } from 'next-intl';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import RevenueChart from '@/components/dashboard/revenue-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardChartData {
  revenueData: { date: string; revenue: number }[];
  orderStatusDistribution: { status: string; count: number }[];
}

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#f97316', '#22c55e', '#ef4444'];
const localizedStatuses = new Set([
  'pending',
  'confirmed',
  'preparing',
  'delivering',
  'delivered',
  'cancelled',
]);

export default function OverviewCharts() {
  const t = useTranslations('overview');
  const { data } = useSuspenseQuery<DashboardChartData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiGet<DashboardChartData>('/admin/dashboard'),
  });

  const statusLabel = (status: string) => {
    return localizedStatuses.has(status) ? t(`orderStatuses.${status}`) : status;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.revenue7dTitle')}</CardTitle>
          <CardDescription>{t('charts.revenue7dDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenueData?.length > 0 ? (
            <>
              <RevenueChart
                data={data.revenueData}
                label={t('charts.revenueLabel')}
                labelPrefix={t('charts.dateLabelPrefix')}
              />
              <RevenueDataTable rows={data.revenueData} />
            </>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              {t('charts.emptyRevenue')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('charts.orderStatusTitle')}</CardTitle>
          <CardDescription>{t('charts.orderStatusDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.orderStatusDistribution?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.orderStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                  >
                    {data.orderStatusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => [value, statusLabel(name)]}
                  />
                  <Legend formatter={(value: string) => statusLabel(value)} />
                </PieChart>
              </ResponsiveContainer>
              <OrderStatusDataTable rows={data.orderStatusDistribution} statusLabel={statusLabel} />
            </>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              {t('charts.emptyOrderStatus')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RevenueDataTable({ rows }: { rows: DashboardChartData['revenueData'] }) {
  const t = useTranslations('overview');

  return (
    <table className="sr-only">
      <caption>{t('charts.revenueTableCaption')}</caption>
      <thead>
        <tr>
          <th>{t('charts.revenueColumns.date')}</th>
          <th>{t('charts.revenueColumns.revenue')}</th>
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

function OrderStatusDataTable({
  rows,
  statusLabel,
}: {
  rows: DashboardChartData['orderStatusDistribution'];
  statusLabel: (status: string) => string;
}) {
  const t = useTranslations('overview');

  return (
    <table className="sr-only">
      <caption>{t('charts.orderStatusTableCaption')}</caption>
      <thead>
        <tr>
          <th>{t('charts.orderStatusColumns.status')}</th>
          <th>{t('charts.orderStatusColumns.count')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.status}>
            <td>{statusLabel(row.status)}</td>
            <td>{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
