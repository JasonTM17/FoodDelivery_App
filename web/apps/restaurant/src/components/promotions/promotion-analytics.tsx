'use client';

import type { Promotion } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';

interface PromotionAnalyticsProps {
  promotion: Promotion;
  analytics?: {
    usageCount: number;
    revenueAttributed: number;
    redemptionRate: number;
    roi: number;
    usageTimeline: { date: string; count: number }[];
  };
}

export function PromotionAnalytics({ promotion, analytics }: PromotionAnalyticsProps) {
  const stats = analytics || {
    usageCount: 0,
    revenueAttributed: 0,
    redemptionRate: 0,
    roi: 0,
    usageTimeline: [],
  };

  return (
    <div className="space-y-6" data-testid="promotion-analytics">
      <h2 className="text-base font-semibold text-gray-900">Hiệu quả khuyến mãi</h2>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Lượt dùng" value={stats.usageCount.toLocaleString()} icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Doanh thu từ KM" value={formatCurrency(stats.revenueAttributed)} icon={<DollarSign className="h-4 w-4" />} />
        <KpiCard label="Tỷ lệ quy đổi" value={`${stats.redemptionRate}%`} icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard label="ROI" value={`${stats.roi}%`} icon={<BarChart3 className="h-4 w-4" />} color={stats.roi >= 100 ? 'text-green-600' : undefined} />
      </div>

      {/* Usage timeline */}
      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Lượt dùng theo ngày</h4>
        <div className="flex items-end gap-1 h-32">
          {stats.usageTimeline.map((point) => {
            const max = Math.max(...stats.usageTimeline.map(p => p.count), 1);
            const height = (point.count / max) * 100;
            return (
              <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-brand-400 rounded-t hover:bg-brand-500 transition-colors"
                  style={{ height: `${height}%` }}
                  title={`${point.date}: ${point.count}`}
                />
              </div>
            );
          })}
          {stats.usageTimeline.length === 0 && (
            <p className="text-sm text-gray-400 w-full text-center self-center">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="card text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className={cn('text-lg font-bold', color || 'text-gray-900')}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
