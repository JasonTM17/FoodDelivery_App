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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('orders.detail');

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
          <SheetTitle>{t('sheetTitle')}</SheetTitle>
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
              <h4 className="font-medium">{t('customerInfo')}</h4>
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">{t('nameLabel')}</span> {order.customer?.name}</p>
                <p><span className="text-muted-foreground">{t('phoneLabel')}</span> {order.customer?.phone}</p>
                <p><span className="text-muted-foreground">{t('addressLabel')}</span> {order.deliveryAddress}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">{t('restaurantInfo')}</h4>
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">{t('nameLabel')}</span> {order.restaurant?.name}</p>
                <p><span className="text-muted-foreground">{t('addressLabel')}</span> {order.restaurant?.address}</p>
              </div>
            </div>

            {order.driver && (
              <div className="space-y-3">
                <h4 className="font-medium">{t('driverInfo')}</h4>
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <p><span className="text-muted-foreground">{t('nameLabel')}</span> {order.driver.name}</p>
                  <p><span className="text-muted-foreground">{t('phoneLabel')}</span> {order.driver.phone}</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">{t('items')}</h4>
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
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span>{formatCurrency(order.total + order.discount - order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deliveryFee')}</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('discount')}</span>
                  <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>{t('total')}</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {order.note && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{t('note')}</h4>
                  <p className="text-sm text-muted-foreground">{order.note}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <Button className="flex-1" onClick={() => updateStatus('confirmed')}>
                  {t('confirmOrder')}
                </Button>
              )}
              {order.status === 'confirmed' && (
                <Button className="flex-1" onClick={() => updateStatus('preparing')}>
                  {t('startPreparing')}
                </Button>
              )}
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => updateStatus('cancelled')}
                >
                  {t('cancelOrder')}
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
