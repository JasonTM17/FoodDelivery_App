'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, Clock } from 'lucide-react';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Link } from '@/navigation';
import { formatCurrency, timeSince } from '@/lib/utils';
import { useRealtimeOrders } from '@/hooks/use-realtime-orders';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConnectionStatus from './connection-status';

export default function LiveOrderFeed() {
  const locale = useLocale();
  const t = useTranslations('realtimeOrders');
  const { orders, status, isError, isFallbackPolling, refetch } = useRealtimeOrders();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{t('title')}</CardTitle>
          {isFallbackPolling && (
            <p className="mt-1 text-[11px] text-muted-foreground">{t('fallbackPolling')}</p>
          )}
        </div>
        <ConnectionStatus status={status} />
      </CardHeader>
      <CardContent className="space-y-2">
        {isError ? (
          <EmptyState
            icon={AlertCircle}
            title={t('errorTitle')}
            description={t('errorDescription')}
            actionLabel={t('retry')}
            onAction={() => void refetch()}
          />
        ) : orders.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          orders.slice(0, 15).map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex cursor-pointer items-center justify-between rounded-md border p-3 transition-all hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid="live-order-row"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">{order.orderCode}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {order.customer?.name ?? '—'} — {order.restaurant?.name ?? '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                <p className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {timeSince(order.placedAt, locale)}
                </p>
              </div>
            </Link>
          ))
        )}
        {orders.length > 0 && isFallbackPolling && (
          <Button variant="ghost" size="sm" className="w-full" onClick={() => void refetch()}>
            {t('refresh')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
