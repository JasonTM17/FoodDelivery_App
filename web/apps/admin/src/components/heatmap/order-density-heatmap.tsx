'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface OrderDensityHeatmapProps {
  cells: HeatmapCell[];
  max?: number;
  loading?: boolean;
}

const heatmapColors = ['#F1F5F9', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#15803D'];
const dayKeys = [
  'days.monday',
  'days.tuesday',
  'days.wednesday',
  'days.thursday',
  'days.friday',
  'days.saturday',
  'days.sunday',
] as const;

function colorScale(value: number, max: number): string {
  const intensity = max > 0 ? value / max : 0;
  if (intensity === 0) return heatmapColors[0];
  if (intensity < 0.2) return heatmapColors[1];
  if (intensity < 0.4) return heatmapColors[2];
  if (intensity < 0.6) return heatmapColors[3];
  if (intensity < 0.8) return heatmapColors[4];
  return heatmapColors[5];
}

export default function OrderDensityHeatmap({ cells, max: maxProp, loading }: OrderDensityHeatmapProps) {
  const t = useTranslations('overviewCharts');
  const [tooltip, setTooltip] = useState<HeatmapCell | null>(null);
  const dayLabels = dayKeys.map((key) => t(key));
  const max = maxProp ?? Math.max(1, ...cells.map((cell) => cell.count));
  const cellMap = useMemo(() => {
    const map = new Map<string, number>();
    cells.forEach((cell) => map.set(`${cell.day}-${cell.hour}`, cell.count));
    return map;
  }, [cells]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t('heatmap.title')}</CardTitle></CardHeader>
        <CardContent>
          <div role="status" aria-label={t('loading')} className="h-64 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!cells.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t('heatmap.title')}</CardTitle></CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          {t('empty.heatmap')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="order-density-heatmap">
      <CardHeader>
        <CardTitle className="text-base">{t('heatmap.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="flex">
            <div className="w-10" />
            <div className="flex flex-1 justify-between">
              {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
                <span key={hour} className="text-[10px] text-muted-foreground">{hour}h</span>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 800 280" className="h-auto w-full" data-testid="heatmap-grid">
            {Array.from({ length: 7 }).map((_, day) =>
              Array.from({ length: 24 }).map((__, hour) => {
                const cell = { day, hour, count: cellMap.get(`${day}-${hour}`) ?? 0 };
                const label = t('heatmap.tooltip', {
                  day: dayLabels[day],
                  hour,
                  count: cell.count,
                });

                return (
                  <rect
                    key={`${day}-${hour}`}
                    data-testid={`heatmap-cell-${day}-${hour}`}
                    role="img"
                    tabIndex={0}
                    aria-label={label}
                    x={hour * 32 + 2}
                    y={day * 38 + 2}
                    width={28}
                    height={34}
                    fill={colorScale(cell.count, max)}
                    rx={4}
                    className="cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary"
                    onMouseEnter={() => setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                    onFocus={() => setTooltip(cell)}
                    onBlur={() => setTooltip(null)}
                  />
                );
              }),
            )}

            {dayLabels.map((label, index) => (
              <text
                key={dayKeys[index]}
                x={2}
                y={index * 38 + 24}
                className="fill-muted-foreground text-[10px]"
                fontSize={10}
              >
                {label}
              </text>
            ))}
          </svg>

          {tooltip && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-card px-3 py-1.5 text-sm shadow-lg">
              {t('heatmap.tooltip', {
                day: dayLabels[tooltip.day],
                hour: tooltip.hour,
                count: tooltip.count,
              })}
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">{t('heatmap.low')}</span>
            {heatmapColors.map((color) => (
              <span key={color} className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
            ))}
            <span className="text-xs text-muted-foreground">{t('heatmap.high')}</span>
          </div>
        </div>

        <table className="sr-only">
          <caption>{t('tables.heatmapCaption')}</caption>
          <thead>
            <tr>
              <th>{t('tables.day')}</th>
              <th>{t('tables.hour')}</th>
              <th>{t('tables.orders')}</th>
            </tr>
          </thead>
          <tbody>
            {cells.map((cell, index) => (
              <tr key={`${cell.day}-${cell.hour}-${index}`}>
                <td>{dayLabels[cell.day] ?? cell.day}</td>
                <td>{cell.hour}:00</td>
                <td>{cell.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
