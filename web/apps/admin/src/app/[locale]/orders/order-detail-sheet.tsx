'use client';

import { apiPatch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export interface OrderDetail {
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

interface OrderDetailSheetProps {
  order: OrderDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: () => void;
}

export default function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onStatusChange,
}: OrderDetailSheetProps) {
  const updateStatus = async (status: string) => {
    if (!order) return;
    await apiPatch(`/admin/orders/${order.id}/status`, { status });
    onOpenChange(false);
    onStatusChange?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chi tiết đơn hàng</SheetTitle>
          <SheetDescription>{order?.orderCode || ''}</SheetDescription>
        </SheetHeader>

        {order && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{order.orderCode}</span>
              <OrderStatusBadge status={order.status} />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Thông tin khách hàng</h4>
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Tên:</span> {order.customer?.name}</p>
                <p><span className="text-muted-foreground">SĐT:</span> {order.customer?.phone}</p>
                <p><span className="text-muted-foreground">Địa chỉ:</span> {order.deliveryAddress}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Thông tin nhà hàng</h4>
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Tên:</span> {order.restaurant?.name}</p>
                <p><span className="text-muted-foreground">Địa chỉ:</span> {order.restaurant?.address}</p>
              </div>
            </div>

            {order.driver && (
              <div className="space-y-3">
                <h4 className="font-medium">Thông tin tài xế</h4>
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Tên:</span> {order.driver.name}</p>
                  <p><span className="text-muted-foreground">SĐT:</span> {order.driver.phone}</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Món ăn</h4>
              <div className="space-y-2">
                {(order.items || []).map((item, idx) => (
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
                <span>{formatCurrency(order.total + order.discount - order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí giao hàng</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Tổng cộng</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {order.note && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Ghi chú</h4>
                  <p className="text-sm text-muted-foreground">{order.note}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <Button className="flex-1" onClick={() => updateStatus('confirmed')}>
                  Xác nhận đơn
                </Button>
              )}
              {order.status === 'confirmed' && (
                <Button className="flex-1" onClick={() => updateStatus('preparing')}>
                  Bắt đầu chuẩn bị
                </Button>
              )}
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => updateStatus('cancelled')}
                >
                  Hủy đơn
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
