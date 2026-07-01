'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapCell {
  day: number;  // 0=Monday ... 6=Sunday
  hour: number; // 0-23
  count: number;
}

interface OrderDensityHeatmapProps {
  cells: HeatmapCell[];
  max?: number;
  loading?: boolean;
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HOUR_LABELS = ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h'];

function colorScale(value: number, max: number): string {
  const intensity = max > 0 ? value / max : 0;
  if (intensity === 0) return '#F1F5F9';
  if (intensity < 0.2) return '#BBF7D0';
  if (intensity < 0.4) return '#86EFAC';
  if (intensity < 0.6) return '#4ADE80';
  if (intensity < 0.8) return '#22C55E';
  return '#15803D';
}

export default function OrderDensityHeatmap({ cells, max: maxProp, loading }: OrderDensityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ day: number; hour: number; count: number } | null>(null);

  const max = maxProp ?? Math.max(1, ...cells.map((c) => c.count));

  const cellMap = useMemo(() => {
    const map = new Map<string, number>();
    cells.forEach((c) => map.set(`${c.day}-${c.hour}`, c.count));
    return map;
  }, [cells]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Mật độ đơn hàng</CardTitle></CardHeader>
        <CardContent><div className="h-64 animate-pulse rounded-lg bg-muted" /></CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="order-density-heatmap">
      <CardHeader>
        <CardTitle className="text-base">Mật độ đơn hàng (Giờ × Ngày)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="flex">
            <div className="w-10" />
            <div className="flex flex-1 justify-between px-0">
              {HOUR_LABELS.map((label) => (
                <span key={label} className="text-[10px] text-muted-foreground">{label}</span>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 800 280" className="w-full h-auto" data-testid="heatmap-grid">
            {Array.from({ length: 7 }).map((_, day) =>
              Array.from({ length: 24 }).map((_, hour) => {
                const count = cellMap.get(`${day}-${hour}`) || 0;
                const x = hour * 32 + 2;
                const y = day * 38 + 2;
                return (
                  <rect
                    key={`${day}-${hour}`}
                    data-testid={`heatmap-cell-${day}-${hour}`}
                    x={x}
                    y={y}
                    width={28}
                    height={34}
                    fill={colorScale(count, max)}
                    rx={4}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={() => setTooltip({ day, hour, count })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            )}

            {DAY_LABELS.map((label, i) => (
              <text
                key={label}
                x={2}
                y={i * 38 + 24}
                className="fill-muted-foreground text-[10px]"
                fontSize={10}
              >
                {label}
              </text>
            ))}
          </svg>

          {tooltip && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-card px-3 py-1.5 text-sm shadow-lg">
              {DAY_LABELS[tooltip.day]}, {tooltip.hour}h: {tooltip.count} đơn
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Ít</span>
            {['#F1F5F9', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#15803D'].map((color) => (
              <div key={color} className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
            ))}
            <span className="text-xs text-muted-foreground">Nhiều</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
