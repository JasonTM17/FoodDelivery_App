'use client';

import { useState, useEffect } from 'react';
import {
  Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Clock,
  ChevronRight, Check, X, BarChart3, DollarSign
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

interface AISuggestion {
  id: string;
  type: 'pricing' | 'menu_mix' | 'marketing' | 'operations';
  title: string;
  description: string;
  impact: string;
  impactType: 'positive' | 'warning';
  actionable: boolean;
  applied: boolean;
}

interface BestSeller {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
  pctOfRevenue: number;
  trend: number;
}

interface SlowMover {
  id: string;
  name: string;
  orderCount: number;
  daysSinceLastOrder: number;
  suggestion: string;
}

interface ForecastPoint {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export default function InsightsPage() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [slowMovers, setSlowMovers] = useState<SlowMover[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [activeHour, setActiveHour] = useState<{ day: number; hour: number; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const [s, b, sm, f, h] = await Promise.all([
        api.get<AISuggestion[]>('/restaurant/insights/suggestions'),
        api.get<BestSeller[]>('/restaurant/insights/best-sellers'),
        api.get<SlowMover[]>('/restaurant/insights/slow-movers'),
        api.get<ForecastPoint[]>('/restaurant/insights/forecast'),
        api.get<{ day: number; hour: number; count: number }[]>('/restaurant/insights/peak-hours'),
      ]);
      setSuggestions(s);
      setBestSellers(b);
      setSlowMovers(sm);
      setForecast(f);
      setActiveHour(h);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể tải dữ liệu phân tích');
    } finally { setIsLoading(false); }
  };

  const handleApplySuggestion = async (id: string) => {
    try {
      await api.post(`/restaurant/insights/suggestions/${id}/apply`);
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, applied: true } : s));
    } catch { /* ignore */ }
  };

  const handleDismissSuggestion = async (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 skeleton" />
        <div className="card h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-64" />
          <div className="card h-64" />
        </div>
      </div>
    );
  }

  const peakHours = activeHour.reduce((acc, h) => {
    acc[h.hour] = (acc[h.hour] || 0) + h.count;
    return acc;
  }, {} as Record<number, number>);

  const maxForecast = Math.max(...forecast.map(f => f.upper || 0), 1);

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Lightbulb className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phân tích & Gợi ý</h1>
          <p className="text-sm text-gray-500">Hôm nay có {suggestions.filter(s => !s.applied).length} đề xuất cho bạn</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Đề xuất thông minh
          </h2>
          <div className="grid gap-3">
            {suggestions.map(s => (
              <div
                key={s.id}
                className={cn(
                  'card flex items-start gap-4 transition-all hover:shadow-md',
                  s.applied && 'opacity-60'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                  s.type === 'pricing' && 'bg-green-100',
                  s.type === 'menu_mix' && 'bg-blue-100',
                  s.type === 'marketing' && 'bg-purple-100',
                  s.type === 'operations' && 'bg-orange-100',
                )}>
                  {s.type === 'pricing' && <DollarSign className="h-5 w-5 text-green-600" />}
                  {s.type === 'menu_mix' && <BarChart3 className="h-5 w-5 text-blue-600" />}
                  {s.type === 'marketing' && <TrendingUp className="h-5 w-5 text-purple-600" />}
                  {s.type === 'operations' && <Clock className="h-5 w-5 text-orange-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900">{s.title}</h4>
                  <p className="text-sm text-gray-600 mt-0.5">{s.description}</p>
                  <p className={cn(
                    'text-xs font-medium mt-1.5',
                    s.impactType === 'positive' ? 'text-green-600' : 'text-amber-600'
                  )}>
                    {s.impact}
                  </p>
                </div>
                {s.actionable && !s.applied && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleApplySuggestion(s.id)}
                      className="btn-primary text-xs py-1.5"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Áp dụng
                    </button>
                    <button
                      onClick={() => handleDismissSuggestion(s.id)}
                      className="btn-ghost text-xs py-1.5"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Bỏ qua
                    </button>
                  </div>
                )}
                {s.applied && (
                  <span className="badge bg-green-100 text-green-700 border-green-200 shrink-0">
                    Đã áp dụng
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best sellers */}
        <section className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Món bán chạy nhất
          </h2>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{item.orderCount} đơn</span>
                      <span>{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{item.pctOfRevenue}%</span>
                    <div className={cn(
                      'flex items-center gap-0.5 text-xs',
                      item.trend > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {item.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(item.trend)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Slow movers alert */}
        <section className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Món bán chậm
          </h2>
          {slowMovers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Không có món bán chậm — tuyệt vời!</p>
          ) : (
            <div className="space-y-3">
              {slowMovers.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.orderCount} đơn trong 30 ngày — {item.daysSinceLastOrder} ngày từ đơn cuối
                    </p>
                    <p className="text-xs text-brand-600 font-medium mt-1">{item.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Peak hours heatmap */}
        <section className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Giờ cao điểm
          </h2>
          <div className="grid grid-cols-24 gap-0.5">
            {Array.from({ length: 24 }, (_, hour) => {
              const count = peakHours[hour] || 0;
              const maxCount = Math.max(...Object.values(peakHours), 1);
              const intensity = count / maxCount;
              return (
                <div key={hour} className="text-center">
                  <div
                    className={cn(
                      'h-8 rounded transition-colors',
                      intensity > 0.7 ? 'bg-red-400' :
                      intensity > 0.4 ? 'bg-orange-400' :
                      intensity > 0.1 ? 'bg-yellow-200' : 'bg-gray-100'
                    )}
                    title={`${hour}h: ${count} đơn`}
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    {hour}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-1">
            <span>Thấp</span>
            <span>Cao</span>
          </div>
        </section>

        {/* Revenue forecast */}
        <section className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Dự báo doanh thu 30 ngày
          </h2>
          {forecast.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Cần ít nhất 30 ngày dữ liệu để dự báo</p>
          ) : (
            <div className="h-48 flex items-end gap-0.5">
              {forecast.map((point, i) => {
                const height = ((point.predicted / maxForecast) * 100).toFixed(1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-full max-w-[12px] rounded-t bg-indigo-200 group-hover:bg-indigo-400 transition-colors"
                        style={{ height: `${height}%`, minHeight: '2px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
