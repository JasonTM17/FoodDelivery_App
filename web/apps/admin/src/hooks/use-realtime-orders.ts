'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminRecentOrder, AdminRecentOrdersResponse } from '@foodflow/api-client';
import { apiGet } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { resolveRealtimeProvider, subscribeToSupabaseOutbox } from '@/lib/supabase-realtime';

export type LiveOrder = AdminRecentOrder;

interface OrderStatusChangedEvent {
  orderId: string;
  status: string;
  timestamp?: string;
}

export type RealtimeConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

interface UseRealtimeOrdersResult {
  orders: LiveOrder[];
  status: RealtimeConnectionStatus;
  isFetching: boolean;
  isFallbackPolling: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
}

const fallbackPollingIntervalMs = 15_000;

export function useRealtimeOrders(): UseRealtimeOrdersResult {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [status, setStatus] = useState<RealtimeConnectionStatus>('connecting');
  const query = useQuery<AdminRecentOrdersResponse>({
    queryKey: ['realtime-orders'],
    queryFn: () => apiGet<AdminRecentOrdersResponse>('/admin/orders/recent', { params: { limit: 20 } }),
    refetchInterval: status === 'connected' ? false : fallbackPollingIntervalMs,
    retry: 2,
  });
  const { refetch } = query;

  useEffect(() => {
    if (query.data?.orders) setOrders(query.data.orders);
  }, [query.data?.orders]);

  useEffect(() => {
    const refreshOrders = () => void refetch();
    const applyStatusUpdate = (event: OrderStatusChangedEvent) => {
      setOrders((currentOrders) => {
        const index = currentOrders.findIndex((order) => order.id === event.orderId);
        if (index < 0) return currentOrders;

        const nextOrders = [...currentOrders];
        nextOrders[index] = { ...nextOrders[index], status: event.status };
        return nextOrders;
      });
    };

    if (resolveRealtimeProvider() === 'supabase') {
      return subscribeToSupabaseOutbox({
        channel: 'private:admin:orders',
        events: {
          'admin:new_order': refreshOrders,
          'admin:order_payment_failed': refreshOrders,
          'admin:order_status_changed': (payload) => applyStatusUpdate(payload as OrderStatusChangedEvent),
        },
        onStatus: (nextStatus) => setStatus(nextStatus),
      });
    }

    const socket = getSocket();
    const subscribe = () => {
      setStatus('connected');
      socket.emit('admin:subscribe_orders');
    };
    const disconnect = () => setStatus('disconnected');
    const reconnecting = () => setStatus('reconnecting');
    const markError = () => setStatus('error');

    if (socket.connected) subscribe();
    else setStatus('connecting');

    socket.on('connect', subscribe);
    socket.on('disconnect', disconnect);
    socket.on('connect_error', markError);
    socket.io.on('reconnect_attempt', reconnecting);
    socket.on('admin:new_order', refreshOrders);
    socket.on('admin:order_payment_failed', refreshOrders);
    socket.on('admin:order_status_changed', applyStatusUpdate);

    return () => {
      socket.emit('admin:unsubscribe_orders');
      socket.off('connect', subscribe);
      socket.off('disconnect', disconnect);
      socket.off('connect_error', markError);
      socket.io.off('reconnect_attempt', reconnecting);
      socket.off('admin:new_order', refreshOrders);
      socket.off('admin:order_payment_failed', refreshOrders);
      socket.off('admin:order_status_changed', applyStatusUpdate);
    };
  }, [refetch]);

  const isFallbackPolling = status !== 'connected';
  const isError = query.isError && orders.length === 0;

  return useMemo(
    () => ({
      orders,
      status: isError ? 'error' : status,
      isFetching: query.isFetching,
      isFallbackPolling,
      isError,
      refetch,
    }),
    [isError, isFallbackPolling, orders, query.isFetching, refetch, status],
  );
}
