'use client';

import { useState, useEffect } from 'react';
import { BarChart3, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';

type Period = 'today' | 'week' | 'month';

interface AnalyticsKpi {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completionRate: number;
}

interface HourlyData {
  hour: number;
  orders: number;
}

interface CategoryData {
  category: string;
  count: number;
  revenue: number;
}

interface AnalyticsData {
  kpi: AnalyticsKpi;
  hourly: HourlyData[];
  categories: CategoryData[];
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'week', label: 'Tuần này' },
  { id: 'month', label: 'Tháng này' },
];

// Stub data used when API endpoint is not yet exposed
const STUB_DATA: AnalyticsData = {
  kpi: { totalOrders: 128, totalRevenue: 12400000, avgOrderValue: 96875, completionRate: 94 },
  hourly: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => ({
    hour,
    orders: Math.floor(Math.abs(Math.sin(hour * 0.7)) * 18) + 2,
  })),
  categories: [
    { category: 'Món chính', count: 58, revenue: 5800000 },
    { category: 'Đồ uống', count: 42, revenue: 2100000 },
    { category: 'Khai vị', count: 28, revenue: 1400000 },
  ],
};

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .get<AnalyticsData>(`/dashboard/analytics?period=${period}`)
      .then(setData)
      .catch(() => setData(STUB_DATA))
      .finally(() => setIsLoading(false));
  }, [period]);

  const kpis = [
    {
      label: 'Tổng đơn hàng',
      value: data?.kpi.totalOrders.toLocaleString('vi-VN') ?? '—',
      sub: 'Đơn đã xử lý',
      icon: <ShoppingBag className="h-4 w-4 text-blue-600" />,
      bg: 'bg-blue-100',
    },
    {
      label: 'Tổng doanh thu',
      value: data ? formatCurrency(data.kpi.totalRevenue) : '—',
      sub: 'Sau phí nền tảng',
      icon: <DollarSign className="h-4 w-4 text-green-600" />,
      bg: 'bg-green-100',
    },
    {
      label: 'Giá trị TB / đơn',
      value: data ? formatCurrency(data.kpi.avgOrderValue) : '—',
      sub: `Hoàn thành: ${data?.kpi.completionRate ?? '—'}%`,
      icon: <TrendingUp className="h-4 w-4 text-purple-600" />,
      bg: 'bg-purple-100',
    },
  ];

  const maxOrders = Math.max(...(data?.hourly.map((h) => h.orders) ?? [1]));
  const maxCatCount = Math.max(...(data?.categories.map((c) => c.count) ?? [1]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <BarChart3 className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Phân tích</h1>
            <p className="text-sm text-gray-500">Hiệu suất hoạt động nhà hàng</p>
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

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card"><div className="h-56 skeleton" /></div>
            <div className="card"><div className="h-56 skeleton" /></div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="kpi-card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', kpi.bg)}>
                    {kpi.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly bar chart */}
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Đơn hàng theo giờ</h2>
              <div className="flex items-end gap-1 h-40">
                {data?.hourly.map((h) => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div
                      className="w-full bg-brand-500 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${Math.max(4, (h.orders / maxOrders) * 128)}px` }}
                      title={`${h.hour}h: ${h.orders} đơn`}
                    />
                    <span className="text-xs text-gray-400 truncate">{h.hour}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Theo danh mục</h2>
              {data?.categories.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Chưa có dữ liệu</p>
              ) : (
                <div className="space-y-4">
                  {data?.categories.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-700">{cat.category}</span>
                        <span className="text-gray-500">{cat.count} đơn · {formatCurrency(cat.revenue)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
