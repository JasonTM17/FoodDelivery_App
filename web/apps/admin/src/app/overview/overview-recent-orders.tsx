'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RecentOrder {
  id: string;
  orderCode: string;
  customer: { name: string };
  restaurant: { name: string };
  driver: { name: string } | null;
  status: string;
  total: number;
  createdAt: string;
}

interface DashboardRecentData {
  recentOrders: RecentOrder[];
}

export default function OverviewRecentOrders() {
  const { data } = useSuspenseQuery<DashboardRecentData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiGet<DashboardRecentData>('/admin/dashboard'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đơn hàng gần đây</CardTitle>
        <CardDescription>10 đơn hàng mới nhất</CardDescription>
      </CardHeader>
      <CardContent>
        {data.recentOrders?.length > 0 ? (
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
  );
}
