'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import OrderStatusBadge from '@/components/order-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface Order {
  id: string;
  orderCode: string;
  customer: { id: string; name: string; phone: string };
  restaurant: { id: string; name: string; address: string };
  driver: { id: string; name: string; phone: string } | null;
  status: string;
  total: number;
  deliveryFee: number;
  discount: number;
  items: { name: string; quantity: number; price: number }[];
  note: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['orders', page, statusFilter, searchQuery],
    queryFn: () =>
      apiGet<OrdersResponse>('/admin/orders', {
        params: {
          page,
          limit: 15,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
        },
      }),
  });

  const handleViewOrder = async (orderId: string) => {
    try {
      const order = await apiGet<Order>(`/admin/orders/${orderId}`);
      setSelectedOrder(order);
      setSheetOpen(true);
    } catch {
      // Fallback: use data from list
      const order = data?.orders.find((o) => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setSheetOpen(true);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý đơn hàng</h1>
        <p className="text-sm text-muted-foreground">
          Xem và quản lý tất cả đơn hàng trong hệ thống
        </p>
      </div>

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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
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
                    <TableHead className="w-12"></TableHead>
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
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder(order.id);
                          }}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (data?.totalPages || 1)}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Chi tiết đơn hàng</SheetTitle>
            <SheetDescription>
              {selectedOrder?.orderCode || ''}
            </SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{selectedOrder.orderCode}</span>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Thông tin khách hàng</h4>
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Tên:</span> {selectedOrder.customer?.name}</p>
                  <p><span className="text-muted-foreground">SĐT:</span> {selectedOrder.customer?.phone}</p>
                  <p><span className="text-muted-foreground">Địa chỉ:</span> {selectedOrder.deliveryAddress}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Thông tin nhà hàng</h4>
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Tên:</span> {selectedOrder.restaurant?.name}</p>
                  <p><span className="text-muted-foreground">Địa chỉ:</span> {selectedOrder.restaurant?.address}</p>
                </div>
              </div>

              {selectedOrder.driver && (
                <div className="space-y-3">
                  <h4 className="font-medium">Thông tin tài xế</h4>
                  <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Tên:</span> {selectedOrder.driver.name}</p>
                    <p><span className="text-muted-foreground">SĐT:</span> {selectedOrder.driver.phone}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Món ăn</h4>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm"
                    >
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="ml-2 text-muted-foreground">x{item.quantity}</span>
                      </div>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatCurrency(selectedOrder.total + selectedOrder.discount - selectedOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí giao hàng</span>
                  <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giảm giá</span>
                    <span className="text-green-600">-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {selectedOrder.note && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Ghi chú</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.note}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-2">
                {selectedOrder.status === 'pending' && (
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      await apiPatch(`/admin/orders/${selectedOrder.id}/status`, {
                        status: 'confirmed',
                      });
                      setSheetOpen(false);
                    }}
                  >
                    Xác nhận đơn
                  </Button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      await apiPatch(`/admin/orders/${selectedOrder.id}/status`, {
                        status: 'preparing',
                      });
                      setSheetOpen(false);
                    }}
                  >
                    Bắt đầu chuẩn bị
                  </Button>
                )}
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={async () => {
                      await apiPatch(`/admin/orders/${selectedOrder.id}/status`, {
                        status: 'cancelled',
                      });
                      setSheetOpen(false);
                    }}
                  >
                    Hủy đơn
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
