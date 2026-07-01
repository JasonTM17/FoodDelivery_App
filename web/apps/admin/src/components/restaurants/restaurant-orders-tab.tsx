'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import { EmptyState } from '@foodflow/ui/empty-state';
import { ShoppingBag, Search } from 'lucide-react';

interface OrderEntry {
  id: string;
  orderCode: string;
  customer: { name: string };
  driver: { name: string } | null;
  status: string;
  total: number;
  createdAt: string;
}

interface OrdersResponse {
  orders: OrderEntry[];
  total: number;
}

export default function RestaurantOrdersTab({ restaurantId }: { restaurantId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['restaurant-orders', restaurantId, page, statusFilter],
    queryFn: () =>
      apiGet<OrdersResponse>(`/admin/restaurants/${restaurantId}/orders`, {
        params: { page, limit: 15, status: statusFilter || undefined, search: search || undefined },
      }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm đơn hàng..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="preparing">Đang chuẩn bị</option>
          <option value="delivering">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !data?.orders?.length ? (
            <EmptyState icon={ShoppingBag} title="Không có đơn hàng" description="Nhà hàng chưa có đơn hàng nào phù hợp" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Tài xế</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Ngày</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono font-medium">{o.orderCode}</TableCell>
                      <TableCell>{o.customer?.name || '—'}</TableCell>
                      <TableCell>{o.driver?.name || '—'}</TableCell>
                      <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-right">{formatCurrency(o.total)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.total > 15 && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-muted-foreground">Trang {page} / {Math.ceil(data.total / 15)}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
                    <Button variant="outline" size="sm" disabled={page * 15 >= data.total} onClick={() => setPage((p) => p + 1)}>Sau</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
