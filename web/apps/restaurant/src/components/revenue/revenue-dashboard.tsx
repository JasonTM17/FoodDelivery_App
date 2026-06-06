'use client';

import { useState, useEffect } from 'react';
import { BarChart3, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { RevenueLineChart } from './revenue-line-chart';
import { RevenueKpiCard } from './revenue-kpi-card';
import { api } from '@/lib/api';
import type { RevenueData } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

type Period = 'today' | 'week' | 'month';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'week', label: 'Tuần này' },
  { id: 'month', label: 'Tháng này' },
];

export function RevenueDashboard() {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');
    api
      .get<RevenueData>(`/dashboard/revenue?period=${period}`)
      .then(setData)
      .catch((err: unknown) =>
        setError((err as { message?: string }).message || 'Không thể tải doanh thu')
      )
      .finally(() => setIsLoading(false));
  }, [period]);

  const todayRevenue = data?.dailyRevenue[data.dailyRevenue.length - 1]?.revenue ?? 0;
  const prevRevenue = data?.dailyRevenue[data.dailyRevenue.length - 2]?.revenue ?? 0;
  const revenueChange =
    prevRevenue > 0 ? (((todayRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : '0';
  const isPositive = parseFloat(revenueChange) >= 0;

  const currentPeriodLabel = PERIODS.find((p) => p.id === period)?.label.toLowerCase() ?? '';

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <BarChart3 className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Doanh thu</h1>
            <p className="text-sm text-gray-500">Tổng quan doanh thu nhà hàng</p>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                period === p.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isLoading || !data ? (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="kpi-card space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-24 skeleton" />
                  <div className="h-8 w-8 rounded-lg skeleton" />
                </div>
                <div className="h-8 w-32 skeleton" />
                <div className="h-3 w-20 skeleton" />
              </div>
            ))}
          </div>
          <div className="card mb-6"><div className="h-72 skeleton" /></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <RevenueKpiCard
              label="Tổng doanh thu"
              value={formatCurrency(data.totalRevenue)}
              trend={{ value: Math.abs(parseFloat(revenueChange)).toString(), positive: isPositive, label: 'so kỳ trước' }}
              icon={<DollarSign className="h-4 w-4 text-green-600" />}
              iconBg="bg-green-100"
            />
            <RevenueKpiCard
              label="Tổng đơn hàng"
              value={data.totalOrders.toString()}
              subtext="Đơn đã hoàn thành"
              icon={<ShoppingBag className="h-4 w-4 text-blue-600" />}
              iconBg="bg-blue-100"
            />
            <RevenueKpiCard
              label="Giá trị TB / đơn"
              value={formatCurrency(data.averageOrderValue)}
              subtext="Trung bình mỗi đơn"
              icon={<TrendingUp className="h-4 w-4 text-purple-600" />}
              iconBg="bg-purple-100"
            />
            <RevenueKpiCard
              label="Hôm nay"
              value={formatCurrency(todayRevenue)}
              subtext="Doanh thu hôm nay"
              icon={<DollarSign className="h-4 w-4 text-orange-600" />}
              iconBg="bg-orange-100"
            />
          </div>

          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Doanh thu {currentPeriodLabel}
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-brand-500" />
                <span className="text-xs text-gray-500">Doanh thu (VNĐ)</span>
              </div>
            </div>
            <RevenueLineChart data={data.dailyRevenue} type="line" />
          </div>

          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Món bán chạy nhất</h2>
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
                        i === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                      )}>{i + 1}</span>
                    </div>
                    <div className="col-span-5 flex items-center font-medium text-gray-900">{item.name}</div>
                    <div className="col-span-3 flex items-center justify-end text-gray-700">{item.quantity}</div>
                    <div className="col-span-3 flex items-center justify-end font-medium text-gray-900">{formatCurrency(item.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
