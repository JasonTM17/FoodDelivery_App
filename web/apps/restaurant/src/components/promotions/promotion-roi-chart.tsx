'use client';

import { formatCurrency } from '@/lib/utils';

interface PromotionRoiChartProps {
  data: { date: string; revenueAttributed: number; discountGiven: number }[];
}

export function PromotionRoiChart({ data }: PromotionRoiChartProps) {
  const maxVal = Math.max(...data.map(d => Math.max(d.revenueAttributed, d.discountGiven)), 1);

  return (
    <div className="space-y-3" data-testid="promotion-roi-chart">
      <h4 className="text-sm font-semibold text-gray-900">Doanh thu và chi phí khuyến mãi</h4>

      <div className="flex items-end gap-0.5 h-32">
        {data.map((point) => (
          <div key={point.date} className="flex-1 flex flex-col justify-end items-center gap-0.5 group">
            <div className="flex gap-px w-full justify-center">
              <div
                className="w-2 bg-brand-500 rounded-t-sm"
                style={{ height: `${(point.revenueAttributed / maxVal) * 100}%`, minHeight: point.revenueAttributed > 0 ? '2px' : '0' }}
              />
              <div
                className="w-2 bg-red-400 rounded-t-sm"
                style={{ height: `${(point.discountGiven / maxVal) * 100}%`, minHeight: point.discountGiven > 0 ? '2px' : '0' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-brand-500" />
          <span>Doanh thu từ KM</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-red-400" />
          <span>Chi phí giảm giá</span>
        </div>
      </div>
    </div>
  );
}
