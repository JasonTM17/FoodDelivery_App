'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import StatCard from '@/components/stat-card';
import RevenueChart from '@/components/revenue-chart';
import OrderStatusBadge from '@/components/order-status-badge';
import {
  ShoppingBag,
  ClipboardList,
  DollarSign,
  Star,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface DashboardData {
  totalOrders: number;
  todayOrders: number;
  todayRevenue: number;
  avgDriverRating: number;
  orderTrend: number;
  revenueTrend: number;
  revenueData: { date: string; revenue: number }[];
  orderStatusDistribution: { status: string; count: number }[];
  recentOrders: {
    id: string;
    orderCode: string;
    customer: { name: string };
    restaurant: { name: string };
    driver: { name: string } | null;
    status: string;
    total: number;
    createdAt: string;
  }[];
}

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#f97316', '#22c55e', '#ef4444'];

export default function OverviewPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiGet<DashboardData>('/admin/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan hoạt động của hệ thống FoodFlow
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Tổng đơn hàng"
          value={data.totalOrders.toLocaleString()}
          trend={data.orderTrend}
          trendLabel="so với tháng trước"
          iconClassName="bg-blue-500"
        />
        <StatCard
          icon={ShoppingBag}
          label="Đơn hôm nay"
          value={data.todayOrders.toLocaleString()}
          iconClassName="bg-indigo-500"
        />
        <StatCard
          icon={DollarSign}
          label="Doanh thu hôm nay"
          value={formatCurrency(data.todayRevenue)}
          trend={data.revenueTrend}
          trendLabel="so với hôm qua"
          iconClassName="bg-green-500"
        />
        <StatCard
          icon={Star}
          label="Rating TB tài xế"
          value={data.avgDriverRating.toFixed(1)}
          iconClassName="bg-yellow-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu 7 ngày</CardTitle>
            <CardDescription>Biểu đồ doanh thu trong 7 ngày gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {data.revenueData && data.revenueData.length > 0 ? (
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
            {data.orderStatusDistribution && data.orderStatusDistribution.length > 0 ? (
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
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend
                    formatter={(value: string) => {
                      const labels: Record<string, string> = {
                        pending: 'Chờ xác nhận',
                        confirmed: 'Đã xác nhận',
                        preparing: 'Đang chuẩn bị',
                        delivering: 'Đang giao',
                        delivered: 'Đã giao',
                        cancelled: 'Đã hủy',
                      };
                      return labels[value] || value;
                    }}
                  />
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

      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
          <CardDescription>10 đơn hàng mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentOrders && data.recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Nhà hàng</TableHead>
                  <TableHead>Tài xế</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderCode}</TableCell>
                    <TableCell>{order.customer?.name || '—'}</TableCell>
                    <TableCell>{order.restaurant?.name || '—'}</TableCell>
                    <TableCell>{order.driver?.name || '—'}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Chưa có đơn hàng nào
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
