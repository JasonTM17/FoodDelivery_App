'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

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

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const t = useTranslations('orders.detail');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data: order, isLoading, error, refetch } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => apiGet<Order>(`/admin/orders/${id}`),
  });

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    setActionError('');
    try {
      await apiPatch(`/admin/orders/${id}/status`, { status });
      refetch();
    } catch (err) {
      setActionError((err as { message?: string }).message || t('statusUpdateError'));
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{t('notFound')}</p>
        <Button asChild>
          <Link href="/orders">{t('back')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.orderCode}</h1>
          <p className="text-sm text-muted-foreground">
            {t('createdAt', { date: formatDate(order.createdAt) })}
          </p>
        </div>
        <div className="ml-auto">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('customerInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">{t('nameLabel')}</span> {order.customer?.name}</p>
            <p><span className="text-muted-foreground">{t('phoneLabel')}</span> {order.customer?.phone}</p>
            <p><span className="text-muted-foreground">{t('addressLabel')}</span> {order.deliveryAddress}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('restaurantInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">{t('nameLabel')}</span> {order.restaurant?.name}</p>
            <p><span className="text-muted-foreground">{t('addressLabel')}</span> {order.restaurant?.address}</p>
          </CardContent>
        </Card>
      </div>

      {order.driver && (
        <Card>
          <CardHeader>
            <CardTitle>{t('driverInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">{t('nameLabel')}</span> {order.driver.name}</p>
            <p><span className="text-muted-foreground">{t('phoneLabel')}</span> {order.driver.phone}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('items')}</CardTitle>
        </CardHeader>
        <CardContent>
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

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
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
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>{t('total')}</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.note && (
        <Card>
          <CardHeader>
            <CardTitle>{t('note')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.note}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('updateStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          {actionError && (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {order.status === 'pending' && (
              <Button onClick={() => updateStatus('confirmed')} disabled={actionLoading}>
                {t('confirmOrder')}
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button onClick={() => updateStatus('preparing')} disabled={actionLoading}>
                {t('startPreparing')}
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button onClick={() => updateStatus('delivering')} disabled={actionLoading}>
                {t('startDelivery')}
              </Button>
            )}
            {order.status === 'delivering' && (
              <Button onClick={() => updateStatus('delivered')} disabled={actionLoading}>
                {t('markDelivered')}
              </Button>
            )}
            {['pending', 'confirmed'].includes(order.status) && (
              <Button
                variant="destructive"
                onClick={() => updateStatus('cancelled')}
                disabled={actionLoading}
              >
                {t('cancelOrder')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
