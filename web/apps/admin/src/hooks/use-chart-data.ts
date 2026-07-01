'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

interface RevenueChartPoint {
  date: string;
  revenue: number;
  prevRevenue?: number;
}

interface OrderStatusPoint {
  date: string;
  pending: number;
  confirmed: number;
  delivering: number;
  completed: number;
  cancelled: number;
}

interface DriverOnlinePoint {
  hour: number;
  count: number;
  avgPayout?: number;
}

interface TopRestaurant {
  id: string;
  name: string;
  revenue: number;
  orderCount: number;
  rating: number;
}

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface AllChartsData {
  revenue: RevenueChartPoint[];
  orderStatus: OrderStatusPoint[];
  driverOnline: DriverOnlinePoint[];
  topRestaurants: TopRestaurant[];
  heatmap: HeatmapCell[];
}

interface UseChartDataOptions {
  period?: string;
  comparePeriod?: string;
}

export function useChartData(options?: UseChartDataOptions) {
  const period = options?.period || '30d';
  const compare = options?.comparePeriod || 'prev';

  return useSuspenseQuery<AllChartsData>({
    queryKey: ['admin-charts', period, compare],
    queryFn: () => apiGet<AllChartsData>('/admin/charts', { params: { period, compare } }),
    refetchInterval: 60000,
  });
}
