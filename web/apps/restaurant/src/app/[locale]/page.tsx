'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { BarChart3, ChevronRight, ArrowRight, RefreshCw, ShoppingBag } from 'lucide-react';
import { RevenueSummaryCards } from '@/components/revenue/revenue-summary-cards';
import { RevenueAreaChart } from '@/components/revenue/revenue-area-chart';
import { CategoryMixDonut } from '@/components/revenue/category-mix-donut';
import { BestSellersList } from '@/components/insights/best-sellers-list';
import { api } from '@/lib/api';
import type { DashboardOrder, RestaurantDashboard } from '@/lib/types';
import { formatCurrency, formatTimeAgo, cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<RestaurantDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<RestaurantDashboard>('/restaurant/dashboard?days=7');
      setDashboard(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải tổng quan nhà hàng';
      setDashboard(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <BarChart3 className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            <span className="gradient-text">Tổng quan</span>
          </h1>
          <p className="text-sm text-gray-500">Hiệu suất kinh doanh 7 ngày gần nhất</p>
        </div>
      </div>

      {error && <RetryableError message={error} onRetry={loadDashboard} />}

      {!dashboard ? (
        <div className="card py-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <h2 className="text-sm font-semibold text-gray-900">Chưa có dữ liệu tổng quan</h2>
          <p className="mt-1 text-sm text-gray-500">
            Dữ liệu sẽ xuất hiện khi backend trả về đơn hàng, doanh thu và insight thật.
          </p>
        </div>
      ) : (
        <>
          <RevenueSummaryCards summary={dashboard.summary} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <RevenueAreaChart data={dashboard.summary.byDay} periodLabel="7 ngày qua" />
            </div>
            <div className="card">
              <CategoryMixDonut data={dashboard.summary.byCategory} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 card">
              <BestSellersList items={dashboard.bestSellers} />
            </div>

            <RecentOrdersCard
              orders={dashboard.recentOrders}
              onOpenOrder={(id) => router.push(`/orders/${id}`)}
              onOpenAll={() => router.push('/orders')}
            />
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="card h-28 skeleton" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card h-64 skeleton" />
        <div className="card h-64 skeleton" />
      </div>
    </div>
  );
}

function RetryableError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Thử lại
      </button>
    </div>
  );
}

function RecentOrdersCard({
  orders,
  onOpenOrder,
  onOpenAll,
}: {
  orders: DashboardOrder[];
  onOpenOrder: (id: string) => void;
  onOpenAll: () => void;
}) {
  return (
    <div className="lg:col-span-2 card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-brand-600" />
          Đơn hàng gần đây
        </h3>
        <button
          type="button"
          onClick={onOpenAll}
          className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          Xem tất cả <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <ShoppingBag className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => onOpenOrder(order.id)}
              className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-gray-400 font-mono w-16 shrink-0">
                  {formatTimeAgo(order.createdAt)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {order.customerName || order.code}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} món
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(order.total)}
                </span>
                <StatusBadge status={order.status} />
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    created: { label: 'Mới tạo', cls: 'bg-gray-100 text-gray-700' },
    pending_payment: { label: 'Chờ thanh toán', cls: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Đã thanh toán', cls: 'bg-blue-100 text-blue-700' },
    restaurant_pending: { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-700' },
    restaurant_accepted: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-700' },
    preparing: { label: 'Đang chuẩn bị', cls: 'bg-purple-100 text-purple-600' },
    ready_for_pickup: { label: 'Sẵn sàng lấy', cls: 'bg-brand-100 text-brand-700' },
    driver_assigned: { label: 'Đã có tài xế', cls: 'bg-cyan-100 text-cyan-700' },
    picked_up: { label: 'Đã lấy món', cls: 'bg-cyan-100 text-cyan-700' },
    delivering: { label: 'Đang giao', cls: 'bg-cyan-100 text-cyan-700' },
    delivered: { label: 'Đã giao', cls: 'bg-green-100 text-green-700' },
    completed: { label: 'Hoàn tất', cls: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700' },
    refunded: { label: 'Đã hoàn tiền', cls: 'bg-red-100 text-red-700' },
  };
  const info = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', info.cls)}>
      {info.label}
    </span>
  );
}
