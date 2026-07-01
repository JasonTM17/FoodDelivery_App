'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

interface LiveOrder {
  id: string;
  orderCode: string;
  customer: { name: string };
  restaurant: { name: string };
  driver: { name: string } | null;
  status: string;
  total: number;
  placedAt: string;
}

interface RealtimeOrdersResponse {
  orders: LiveOrder[];
}

interface UseRealtimeOrdersResult {
  data: LiveOrder[] | undefined;
  status: 'connected' | 'reconnecting' | 'disconnected' | 'error';
  isFetching: boolean;
}

export function useRealtimeOrders(): UseRealtimeOrdersResult {
  const { data, isFetching, isError } = useQuery<RealtimeOrdersResponse>({
    queryKey: ['realtime-orders'],
    queryFn: () => apiGet<RealtimeOrdersResponse>('/admin/orders/recent?limit=20'),
    refetchInterval: 5000,
    retry: 2,
  });

  return {
    data: data?.orders,
    status: isError ? 'error' : isFetching ? 'connected' : 'connected',
    isFetching,
  };
}
