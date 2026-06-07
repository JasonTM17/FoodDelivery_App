'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import OrderDetailSheet, { type OrderDetail } from './order-detail-sheet';
import { useTableFilters } from '@/hooks/use-table-filters';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface OrdersResponse {
  orders: OrderDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function OrdersTableClient() {
  const { page, setPage, filter: statusFilter, setFilter: setStatusFilter, prevPage, nextPage } =
    useTableFilters();
  const { value: searchQuery, setValue: setSearchQuery, debouncedValue: debouncedSearch } =
    useDebouncedSearch();
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery<OrdersResponse>({
    queryKey: ['orders', page, statusFilter, debouncedSearch],
    queryFn: () =>
      apiGet<OrdersResponse>('/admin/orders', {
        params: {
          page,
          limit: 15,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: debouncedSearch || undefined,
        },
      }),
  });

  const handleViewOrder = async (orderId: string) => {
    try {
      const order = await apiGet<OrderDetail>(`/admin/orders/${orderId}`);
      setSelectedOrder(order);
    } catch {
      const found = data?.orders.find((o) => o.id === orderId);
      if (found) setSelectedOrder(found);
    }
    setSheetOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Đơn hàng</CardTitle>
              <CardDescription>
                {data ? `Tổng số: ${data.total} đơn hàng` : 'Đang tải...'}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm mã đơn..."
                  className="w-full pl-8 sm:w-48"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                  <SelectItem value="delivering">Đang giao</SelectItem>
                  <SelectItem value="delivered">Đã giao</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : data && data.orders.length > 0 ? (
            <>
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
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => handleViewOrder(order.id)}
                    >
                      <TableCell className="font-medium">{order.orderCode}</TableCell>
                      <TableCell>{order.customer?.name || '—'}</TableCell>
                      <TableCell>{order.restaurant?.name || '—'}</TableCell>
                      <TableCell>{order.driver?.name || '—'}</TableCell>
                      <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleViewOrder(order.id); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Trang {data.page} / {data.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={prevPage} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nextPage(data.totalPages)}
                    disabled={page >= data.totalPages}
                  >
                    Sau<ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Không tìm thấy đơn hàng nào
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailSheet
        order={selectedOrder}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={() => refetch()}
      />
    </>
  );
}
