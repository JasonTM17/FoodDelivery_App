'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { RevenueSummaryCards } from '@/components/revenue/revenue-summary-cards';
import { RevenueAreaChart } from '@/components/revenue/revenue-area-chart';
import { CategoryMixDonut } from '@/components/revenue/category-mix-donut';
import { HourOfDayBar } from '@/components/revenue/hour-of-day-bar';
import { RevenueSourcePie } from '@/components/revenue/revenue-source-pie';
import { PaymentMethodBar } from '@/components/revenue/payment-method-bar';
import { BenchmarkOverlay } from '@/components/revenue/benchmark-overlay';
import { RevenueComparison } from '@/components/revenue/revenue-comparison';
import { RevenueExportButton } from '@/components/revenue/revenue-export-button';
import { RevenueDrillDownTable } from '@/components/revenue/revenue-drill-down-table';
import {
  fetchIndustryBenchmark,
  fetchRevenueBreakdown,
  fetchRevenueSummary,
} from '@/lib/actions/revenue-actions';
import type {
  IndustryBenchmark,
  RevenueBreakdownRow,
  RevenueSummary,
} from '@/lib/types';
import { cn } from '@/lib/utils';

type Period = '7' | '30' | '90';

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: '7', label: '7 ngày' },
  { id: '30', label: '30 ngày' },
  { id: '90', label: '90 ngày' },
];

export default function RevenuePage() {
  const [period, setPeriod] = useState<Period>('7');
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [benchmark, setBenchmark] = useState<IndustryBenchmark | null>(null);
  const [drillDown, setDrillDown] = useState<RevenueBreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadRevenue = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - Number(period) * 86_400_000)
      .toISOString()
      .slice(0, 10);

    try {
      const [summaryData, benchmarkData, breakdownData] = await Promise.all([
        fetchRevenueSummary(period),
        fetchIndustryBenchmark(),
        fetchRevenueBreakdown({ startDate, endDate }),
      ]);
      if (signal.aborted) return;
      setSummary(summaryData);
      setBenchmark(benchmarkData);
      setDrillDown(breakdownData.rows);
    } catch (cause) {
      if (signal.aborted) return;
      setSummary(null);
      setBenchmark(null);
      setDrillDown([]);
      setError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu doanh thu.');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const controller = new AbortController();
    void loadRevenue(controller.signal);
    return () => controller.abort();
  }, [loadRevenue, reloadKey]);

  if (loading) return <RevenuePageSkeleton />;

  if (error || !summary) {
    return (
      <div className="card mx-auto mt-16 max-w-lg text-center" role="alert">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="mt-3 text-lg font-semibold text-gray-900">Không thể tải doanh thu</h1>
        <p className="mt-1 text-sm text-gray-500">{error ?? 'Dữ liệu chưa sẵn sàng.'}</p>
        <button className="btn-primary mt-4" onClick={() => setReloadKey((key) => key + 1)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <BarChart3 className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Doanh thu</h1>
            <p className="text-sm text-gray-500">Phân tích từ đơn hàng đã hoàn tất</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1" aria-label="Khoảng thời gian">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setPeriod(option.id)}
                aria-pressed={period === option.id}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  period === option.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <RevenueExportButton data={drillDown} filename={`doanh-thu-${period}-ngay`} />
        </div>
      </header>

      <RevenueSummaryCards summary={summary} industryAvg={benchmark?.industry} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <RevenueAreaChart data={summary.byDay} periodLabel={`${period} ngày qua`} />
        </div>
        <div className="card"><RevenueComparison summary={summary} /></div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card"><CategoryMixDonut data={summary.byCategory} /></div>
        <div className="card"><HourOfDayBar data={summary.byHour} /></div>
        <div className="card"><RevenueSourcePie data={summary.bySource} /></div>
        <div className="card"><PaymentMethodBar data={summary.byPayment} /></div>
      </div>

      {benchmark && (
        <BenchmarkOverlay
          restaurant={{
            avgOrderValue: benchmark.restaurant.avgOrderValue,
            repeatRate: benchmark.restaurant.repeatCustomerRate,
          }}
          industry={{
            avgOrderValue: benchmark.industry.avgOrderValue,
            repeatRate: benchmark.industry.repeatCustomerRate,
          }}
          updatedAt={benchmark.updatedAt}
        />
      )}

      <div className="card"><RevenueDrillDownTable data={drillDown} /></div>
    </div>
  );
}

function RevenuePageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Đang tải dữ liệu doanh thu" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="card h-28 skeleton" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card h-72 skeleton lg:col-span-2" />
        <div className="card h-72 skeleton" />
      </div>
    </div>
  );
}
