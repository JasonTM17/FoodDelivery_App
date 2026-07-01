'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { AiSuggestionCard } from '@/components/insights/ai-suggestion-card';
import { PeakHoursHeatmap } from '@/components/insights/peak-hours-heatmap';
import { BestSellersList } from '@/components/insights/best-sellers-list';
import { SlowMoversAlert } from '@/components/insights/slow-movers-alert';
import { RevenueForecastChart } from '@/components/insights/revenue-forecast-chart';
import { api } from '@/lib/api';
import type { RestaurantInsights } from '@/lib/types';

const EMPTY_INSIGHTS: RestaurantInsights = {
  suggestions: [],
  peakHours: [],
  bestSellers: [],
  slowMovers: [],
  forecast: [],
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<RestaurantInsights>(EMPTY_INSIGHTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<RestaurantInsights>('/restaurant/insights');
      setInsights(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu phân tích';
      setInsights(EMPTY_INSIGHTS);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  if (loading) {
    return <InsightsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <Lightbulb className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phân tích & Đề xuất</h1>
          <p className="text-sm text-gray-500">
            Gợi ý dựa trên dữ liệu đơn hàng, menu và doanh thu thật
          </p>
        </div>
      </div>

      {error && <RetryableError message={error} onRetry={loadInsights} />}

      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Hôm nay có {insights.suggestions.length} đề xuất cho bạn
        </h2>
        <div className="space-y-3">
          {insights.suggestions.map((suggestion) => (
            <AiSuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
          {insights.suggestions.length === 0 && (
            <div className="card text-center py-8">
              <Lightbulb className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Chưa có đề xuất nào. Dữ liệu sẽ hiển thị sau khi có đủ đơn hàng.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <PeakHoursHeatmap data={insights.peakHours} />
        </div>
        <div className="card">
          <BestSellersList items={insights.bestSellers} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SlowMoversAlert items={insights.slowMovers} />
        </div>
        <div className="card">
          <RevenueForecastChart data={insights.forecast} />
        </div>
      </div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-lg bg-gray-100 animate-pulse" />
      ))}
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
