'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/dashboard/stat-card';
import { ShoppingBag, ClipboardList, DollarSign, Star } from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  todayRevenue: number;
  avgDriverRating: number;
  orderTrend: number;
  revenueTrend: number;
  revenueData: { date: string; revenue: number }[];
  orderStatusDistribution: { status: string; count: number }[];
  recentOrders: {
    id: string;
    orderCode: string;
    customer: { name: string };
    restaurant: { name: string };
    driver: { name: string } | null;
    status: string;
    total: number;
    createdAt: string;
  }[];
}

export default function OverviewStats() {
  const { data } = useSuspenseQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiGet<DashboardStats>('/admin/dashboard'),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={ClipboardList}
        label="Tổng đơn hàng"
        value={data.totalOrders.toLocaleString()}
        trend={data.orderTrend}
        trendLabel="so với tháng trước"
        iconClassName="bg-primary"
      />
      <StatCard
        icon={ShoppingBag}
        label="Đơn hôm nay"
        value={data.todayOrders.toLocaleString()}
        iconClassName="bg-indigo-500"
      />
      <StatCard
        icon={DollarSign}
        label="Doanh thu hôm nay"
        value={formatCurrency(data.todayRevenue)}
        trend={data.revenueTrend}
        trendLabel="so với hôm qua"
        iconClassName="bg-green-500"
      />
      <StatCard
        icon={Star}
        label="Rating TB tài xế"
        value={data.avgDriverRating.toFixed(1)}
        iconClassName="bg-yellow-500"
      />
    </div>
  );
}
