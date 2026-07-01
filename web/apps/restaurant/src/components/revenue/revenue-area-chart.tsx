'use client';

import { formatCurrency } from '@/lib/utils';

interface RevenueAreaChartProps {
  data: { date: string; vnd: number; orderCount: number }[];
  comparison?: { date: string; vnd: number }[];
  periodLabel?: string;
}

export function RevenueAreaChart({ data, comparison, periodLabel }: RevenueAreaChartProps) {
  const maxVal = Math.max(
    ...data.map(d => d.vnd),
    ...(comparison?.map(c => c.vnd) || []),
    1
  );

  return (
    <div className="space-y-3" data-testid="revenue-area-chart">
      {periodLabel && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Doanh thu {periodLabel}</h4>
        </div>
      )}

      <div className="flex items-end gap-0.5 h-40 relative">
        {/* Grid lines */}
        {[0, 25, 50, 75].map((pct) => (
          <div
            key={pct}
            className="absolute left-0 right-0 border-t border-gray-100"
            style={{ bottom: `${pct}%` }}
          />
        ))}

        {data.map((point) => {
          const height = (point.vnd / maxVal) * 100;
          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col justify-end group relative"
              title={`${point.date}: ${formatCurrency(point.vnd)} (${point.orderCount} đơn)`}
            >
              <div
                className="w-full bg-brand-400/60 rounded-t-sm hover:bg-brand-400 transition-colors"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>

      {comparison && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-brand-400/60" />
            <span>Kỳ này</span>
          </div>
        </div>
      )}
    </div>
  );
}
