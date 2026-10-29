'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Card } from '@foodflow/ui';
import { History } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import { driverStatusLabel } from '@/lib/driver-status';
import { formatVnd, formatDateTime } from '@/lib/format';
import type { DriverOrder } from '@/lib/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/feedback';

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthChecked } = useAuth();
  const [orders, setOrders] = useState<DriverOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.get<DriverOrder[]>('/driver/orders/history?limit=50');
      setOrders(Array.isArray(list) ? list : []);
    } catch {
      setError('Could not load trip history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/history');
      return;
    }
    void load();
  }, [isAuthChecked, isAuthenticated, load, router]);

  if (!isAuthChecked || loading) return <LoadingBlock label="Loading trips" />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Trips</h1>
      {(orders ?? []).length === 0 ? (
        <EmptyBlock icon={History} title="No completed trips yet" />
      ) : (
        <ul className="space-y-3">
          {(orders ?? []).map((order) => (
            <li key={order.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{order.restaurantName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {order.deliveryAddress.address}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={order.status === 'cancelled' ? 'destructive' : 'success'}>
                    {driverStatusLabel(order.status)}
                  </Badge>
                  <span className="text-sm font-semibold text-green-700">
                    +{formatVnd(order.deliveryFee)}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
