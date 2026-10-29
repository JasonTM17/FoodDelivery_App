'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@foodflow/ui';
import { ReceiptText } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import { formatVnd, formatDateTime } from '@/lib/format';
import { isActiveOrder } from '@/lib/order-status';
import type { Order, OrdersPage } from '@/lib/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/feedback';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { useLanguage } from '@/lib/language-context';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthChecked } = useAuth();
  const { t, locale } = useLanguage();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await api.get<OrdersPage>('/orders?limit=50');
      setOrders(page.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/orders');
      return;
    }
    void load();
  }, [isAuthChecked, isAuthenticated, load, router]);

  const { current, history } = useMemo(() => {
    const all = orders ?? [];
    return {
      current: all.filter((o) => isActiveOrder(o.status)),
      history: all.filter((o) => !isActiveOrder(o.status)),
    };
  }, [orders]);

  if (!isAuthChecked || loading) return <LoadingBlock label="Loading orders" />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  const list = (items: Order[], emptyLabel: string) =>
    items.length === 0 ? (
      <EmptyBlock icon={ReceiptText} title={emptyLabel}>
        <Button asChild variant="outline">
          <Link href="/home">{t("cart.browse")}</Link>
        </Button>
      </EmptyBlock>
    ) : (
      <ul className="space-y-3">
        {items.map((order) => (
          <li key={order.id}>
            <Link href={`/orders/${order.id}`}>
              <Card className="flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {order.restaurant?.name ?? 'Order'} · {formatVnd(order.total)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)} · {order.items?.length ?? 0} {locale === "vi" ? "món" : "items"}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{t("orders.title")}</h1>
      <Tabs defaultValue="current">
        <TabsList aria-label="Order lists">
          <TabsTrigger value="current">{t("orders.active")}</TabsTrigger>
          <TabsTrigger value="history">{t("orders.history")}</TabsTrigger>
        </TabsList>
        <TabsContent value="current" className="pt-3">
          {list(current, t('orders.emptyActive'))}
        </TabsContent>
        <TabsContent value="history" className="pt-3">
          {list(history, t('orders.emptyHistory'))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
