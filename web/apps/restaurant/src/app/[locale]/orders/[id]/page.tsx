'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Receipt, RefreshCw } from 'lucide-react';
import { useRouter } from '@/navigation';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { OrderDriverChat } from '@/components/orders/order-driver-chat';
import { OrderActions } from '@/components/orders/order-actions';
import { OrderPrepTimePicker } from '@/components/orders/order-prep-time-picker';
import {
  CustomerInfoCard,
  OrderDetailSkeleton,
  OrderItemsCard,
  OrderMetaCard,
  StatusPill,
} from '@/components/orders/order-detail-cards';
import { api } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

const TIMELINE_STATUSES: OrderStatus[] = [
  'restaurant_pending',
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'delivering',
  'delivered',
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('orderDetail');
  const orderId = String(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedPrepTime, setSelectedPrepTime] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.get<Order>(`/restaurant/orders/${orderId}`);
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const timelineSteps = useMemo(() => TIMELINE_STATUSES.map((status) => ({
    status,
    label: t(`status.${status}`),
    timestamp: order?.status === status ? order.createdAt : null,
  })), [order?.createdAt, order?.status, t]);

  const handleStatusChange = async (newStatus: OrderStatus, reason?: string) => {
    setIsSubmitting(true);
    try {
      const updated = await api.patch<Order>(`/restaurant/orders/${orderId}/status`, {
        status: newStatus,
        note: reason,
      });
      setOrder(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <OrderDetailSkeleton />;

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl font-bold text-red-600">!</span>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('notFoundTitle')}</h2>
        <p className="mb-6 text-sm text-gray-500">{error || t('notFoundDescription')}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            {t('back')}
          </button>
          <button type="button" onClick={loadOrder} className="btn-primary">
            <RefreshCw className="mr-1.5 h-4 w-4" />
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  const shouldShowPrepPicker = order.status === 'restaurant_accepted' || order.status === 'preparing';
  const shouldShowDriverChat = order.status === 'ready_for_pickup' || order.status === 'delivering';

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => router.push('/orders')} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        {t('backToOrders')}
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <Receipt className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('heading', { code: order.code })}</h1>
            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt, t('unknownTime'))}</p>
          </div>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <OrderItemsCard order={order} />

          <div className="card">
            <OrderActions status={order.status} onStatusChange={handleStatusChange} isSubmitting={isSubmitting} />
          </div>

          {shouldShowPrepPicker && (
            <div className="card">
              <OrderPrepTimePicker selected={selectedPrepTime} onSelect={setSelectedPrepTime} />
            </div>
          )}

          <div className="card">
            <h2 className="mb-4 text-base font-semibold text-gray-900">{t('timelineTitle')}</h2>
            <OrderTimeline currentStatus={order.status} steps={timelineSteps} />
          </div>

          {shouldShowDriverChat && <OrderDriverChat orderId={order.id} />}
        </div>

        <div className="space-y-6">
          <CustomerInfoCard order={order} />
          <OrderMetaCard order={order} />
        </div>
      </div>
    </div>
  );
}
