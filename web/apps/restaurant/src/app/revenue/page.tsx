'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import RevenueChart from '@/components/RevenueChart';
import { api } from '@/lib/api';
import type { RevenueData } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const data = await api.get<RevenueData>('/dashboard/revenue');
        setRevenueData(data);
      } catch (err: unknown) {
        const apiError = err as { message?: string };
        setError(apiError.message || 'Không thể tải dữ liệu doanh thu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl skeleton" />
          <div>
            <div className="h-6 w-36 skeleton mb-1" />
            <div className="h-4 w-24 skeleton" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card space-y-3">
              <div className="h-4 w-24 skeleton" />
              <div className="h-8 w-32 skeleton" />
              <div className="h-3 w-20 skeleton" />
            </div>
          ))}
        </div>
        <div className="card h-72 skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Không thể tải doanh thu</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Thử lại
        </button>
      </div>
    );
  }

  const data = revenueData!;
  const yesterdayRevenue = data.dailyRevenue[data.dailyRevenue.length - 2]?.revenue || 0;
  const todayRevenue = data.dailyRevenue[data.dailyRevenue.length - 1]?.revenue || 0;
  const revenueChange = yesterdayRevenue > 0
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
    : '0';

  const isPositiveChange = parseFloat(revenueChange) >= 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <BarChart3 className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Doanh thu</h1>
          <p className="text-sm text-gray-500">Tổng quan doanh thu nhà hàng</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Tổng doanh thu</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.totalRevenue)}
          </p>
          <div className={cn(
            'flex items-center gap-1 mt-1 text-xs',
            isPositiveChange ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositiveChange ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{Math.abs(parseFloat(revenueChange))}% so với hôm qua</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Tổng đơn hàng</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.totalOrders}</p>
          <p className="text-xs text-gray-400 mt-1">Tổng số đơn đã hoàn thành</p>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Giá trị TB</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.averageOrderValue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Trung bình mỗi đơn</p>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Hôm nay</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
              <DollarSign className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(todayRevenue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Doanh thu hôm nay</p>
        </div>
      </div>

      {/* Chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Doanh thu 7 ngày qua
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-500" />
            <span className="text-xs text-gray-500">Doanh thu (VNĐ)</span>
          </div>
        </div>
        <RevenueChart data={data.dailyRevenue} type="bar" />
      </div>

      {/* Top selling items */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Món bán chạy nhất
        </h2>
        {data.topSellingItems.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Chưa có dữ liệu</p>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-12 gap-4 pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Tên món</div>
              <div className="col-span-3 text-right">Đã bán</div>
              <div className="col-span-3 text-right">Doanh thu</div>
            </div>
            {data.topSellingItems.map((item, i) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 py-3 text-sm">
                <div className="col-span-1 flex items-center">
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'text-gray-400'
                  )}>
                    {i + 1}
                  </span>
                </div>
                <div className="col-span-5 flex items-center font-medium text-gray-900">
                  {item.name}
                </div>
                <div className="col-span-3 flex items-center justify-end text-gray-700">
                  {item.quantity}
                </div>
                <div className="col-span-3 flex items-center justify-end font-medium text-gray-900">
                  {formatCurrency(item.revenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
