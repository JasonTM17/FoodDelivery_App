'use client';

import { formatCurrency, cn } from '@/lib/utils';

interface HourOfDayBarProps {
  data: { hour: number; vnd: number; orderCount: number }[];
}

export function HourOfDayBar({ data }: HourOfDayBarProps) {
  const maxVal = Math.max(...data.map(d => d.vnd), 1);
  const peakThreshold = maxVal * 0.6;
  const peakStart = data.findIndex(d => d.vnd >= peakThreshold);
  const peakEnd = data.length - 1 - [...data].reverse().findIndex(d => d.vnd >= peakThreshold);

  return (
    <div className="space-y-3" data-testid="hour-of-day-bar">
      <h4 className="text-sm font-semibold text-gray-900">Doanh thu theo giờ</h4>

      <div className="flex items-end gap-0.5 h-28 relative">
        {/* Peak background */}
        {peakStart >= 0 && peakEnd > peakStart && (
          <div
            className="absolute top-0 bottom-0 bg-brand-50/50 rounded-sm"
            style={{
              left: `${(peakStart / 24) * 100}%`,
              width: `${((peakEnd - peakStart + 1) / 24) * 100}%`,
            }}
          />
        )}

        {data.map((d) => {
          const height = (d.vnd / maxVal) * 100;
          return (
            <div
              key={d.hour}
              className="flex-1 flex flex-col justify-end group"
              title={`${d.hour}h: ${formatCurrency(d.vnd)} (${d.orderCount} đơn)`}
            >
              <div
                className={cn(
                  'w-full rounded-t-sm transition-colors',
                  d.vnd >= peakThreshold ? 'bg-brand-500' : 'bg-gray-300',
                  'hover:bg-brand-600'
                )}
                style={{ height: `${height}%`, minHeight: d.vnd > 0 ? '2px' : '0' }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-brand-500" />
          <span>Giờ cao điểm</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-gray-300" />
          <span>Giờ thấp điểm</span>
        </div>
      </div>
    </div>
  );
}
