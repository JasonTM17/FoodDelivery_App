'use client';

import { TrendingUp, DollarSign, Users, Percent } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { calculateROI, calculateRedemptionRate } from '@/lib/promotion-engine';

interface PromotionAnalyticsProps {
  usageCount: number;
  usageLimit: number;
  revenueGenerated: number;
  discountGiven: number;
  className?: string;
}

export function PromotionAnalytics({ usageCount, usageLimit, revenueGenerated, discountGiven, className }: PromotionAnalyticsProps) {
  const redemption = calculateRedemptionRate(usageCount, usageLimit);
  const roi = calculateROI(revenueGenerated, discountGiven);

  const kpis = [
    { label: 'Lượt dùng', value: `${usageCount} / ${usageLimit > 0 ? usageLimit : '∞'}`, subtext: `${redemption}% tỷ lệ quy đổi`, icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Doanh thu từ KM', value: formatCurrency(revenueGenerated), subtext: 'Tổng doanh thu quy đổi', icon: TrendingUp, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Tổng giảm giá', value: formatCurrency(discountGiven), subtext: 'Tổng tiền đã giảm', icon: DollarSign, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'ROI', value: roi !== null ? `${roi}x` : '--', subtext: roi !== null ? (roi > 2 ? 'Hiệu quả tốt' : 'Cần cải thiện') : 'Chưa đủ dữ liệu', icon: Percent, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ];

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {kpis.map((kpi) => (
        <div key={kpi.label} className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{kpi.label}</span>
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', kpi.iconBg)}>
              <kpi.icon className={cn('h-4 w-4', kpi.iconColor)} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
          <p className="text-xs text-gray-400 mt-1">{kpi.subtext}</p>
        </div>
      ))}

      {usageLimit > 0 && (
        <div className="col-span-full">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Tiến độ sử dụng</span>
            <span>{usageCount}/{usageLimit} ({redemption}%)</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', redemption > 80 ? 'bg-red-400' : redemption > 50 ? 'bg-brand-500' : 'bg-green-400')}
              style={{ width: `${Math.min(redemption, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
