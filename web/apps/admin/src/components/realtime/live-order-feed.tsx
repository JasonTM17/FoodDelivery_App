'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { apiGet } from '@/lib/api';
import { formatCurrency, timeSince } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConnectionStatus from './connection-status';
import { Clock } from 'lucide-react';
import { Link } from '@/navigation';
import { cn } from '@/lib/utils';
import OrderStatusBadge from '@/components/badges/order-status-badge';

interface LiveOrder {
  id: string;
  orderCode: string;
  customer: { name: string };
  restaurant: { name: string };
  status: string;
  total: number;
  placedAt: string;
}

export default function LiveOrderFeed() {
  const locale = useLocale();
  const t = useTranslations('realtimeOrders');
  const { data, isFetching } = useQuery<{ orders: LiveOrder[] }>({
    queryKey: ['realtime-orders'],
    queryFn: () => apiGet('/admin/orders/recent?limit=20'),
    refetchInterval: 5000,
  });

  const orders = data?.orders || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{t('title')}</CardTitle>
        <ConnectionStatus status={isFetching ? 'connected' : 'connected'} />
      </CardHeader>
      <CardContent className="space-y-2">
        {orders.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          orders.slice(0, 15).map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className={cn(
                'flex items-center justify-between rounded-md border p-3 transition-all hover:bg-muted/50 cursor-pointer',
                'animate-fade-in-up'
              )}
              data-testid="live-order-row"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">{order.orderCode}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {order.customer?.name} — {order.restaurant?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" />
                  {timeSince(order.placedAt, locale)}
                </p>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
