'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import RevenueChart from '@/components/dashboard/revenue-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface DashboardChartData {
  revenueData: { date: string; revenue: number }[];
  orderStatusDistribution: { status: string; count: number }[];
}

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#f97316', '#22c55e', '#ef4444'];

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export default function OverviewCharts() {
  const { data } = useSuspenseQuery<DashboardChartData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiGet<DashboardChartData>('/admin/dashboard'),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu 7 ngày</CardTitle>
          <CardDescription>Biểu đồ doanh thu trong 7 ngày gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenueData?.length > 0 ? (
            <RevenueChart data={data.revenueData} />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Chưa có dữ liệu doanh thu
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trạng thái đơn hàng</CardTitle>
          <CardDescription>Phân bố trạng thái đơn hàng hiện tại</CardDescription>
        </CardHeader>
        <CardContent>
          {data.orderStatusDistribution?.length > 0 ? (
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
                  formatter={(value: number, name: string) => [value, statusLabels[name] || name]}
                />
                <Legend formatter={(value: string) => statusLabels[value] || value} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Chưa có dữ liệu đơn hàng
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
