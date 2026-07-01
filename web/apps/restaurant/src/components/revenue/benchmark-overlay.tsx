'use client';

import { formatCurrency, cn } from '@/lib/utils';
import { BarChart3, RefreshCw } from 'lucide-react';

interface BenchmarkOverlayProps {
  restaurant: { avgOrderValue: number; repeatRate: number };
  industry: { avgOrderValue: number; repeatRate: number };
  updatedAt?: string;
}

export function BenchmarkOverlay({ restaurant, industry, updatedAt }: BenchmarkOverlayProps) {
  return (
    <div className="card space-y-4" data-testid="benchmark-overlay">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-brand-600" />
          So sánh ngành
        </h4>
        {updatedAt && (
          <span className="text-xs text-gray-400">Cập nhật: {updatedAt}</span>
        )}
      </div>

      <div className="space-y-4">
        {/* AOV */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Giá trị đơn TB</span>
            <span className={cn(
              'font-semibold',
              restaurant.avgOrderValue >= industry.avgOrderValue ? 'text-green-600' : 'text-red-500'
            )}>
              {formatCurrency(restaurant.avgOrderValue)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${Math.min((restaurant.avgOrderValue / industry.avgOrderValue) * 100, 200)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Trung bình ngành: {formatCurrency(industry.avgOrderValue)}</p>
        </div>

        {/* Repeat Rate */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Tỷ lệ khách quay lại</span>
            <span className={cn(
              'font-semibold',
              restaurant.repeatRate >= industry.repeatRate ? 'text-green-600' : 'text-red-500'
            )}>
              {restaurant.repeatRate}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${Math.min((restaurant.repeatRate / industry.repeatRate) * 100, 200)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Trung bình ngành: {industry.repeatRate}%</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <RefreshCw className="h-3 w-3" />
        <span>Dữ liệu cập nhật hàng quý</span>
      </div>
    </div>
  );
}
