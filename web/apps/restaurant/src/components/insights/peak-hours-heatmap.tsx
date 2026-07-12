'use client';

import type { PeakHour } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface PeakHoursHeatmapProps {
  data: PeakHour[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
  const t = useTranslations('insights.peakHours');
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => t(`days.${day}`));
  const maxCount = Math.max(...data.map(d => d.orderCount), 1);

  const getIntensity = (day: number, hour: number): number => {
    const cell = data.find(d => d.day === day && d.hour === hour);
    return cell ? cell.orderCount / maxCount : 0;
  };

  const getColorClass = (intensity: number): string => {
    if (intensity === 0) return 'bg-gray-50';
    if (intensity <= 0.15) return 'bg-brand-100';
    if (intensity <= 0.3) return 'bg-brand-200';
    if (intensity <= 0.5) return 'bg-brand-300';
    if (intensity <= 0.7) return 'bg-brand-400';
    return 'bg-brand-500';
  };

  return (
    <div className="space-y-2" data-testid="peak-hours-heatmap">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>
      <div
        className="overflow-x-auto"
        role="region"
        aria-label={t('tableLabel')}
        tabIndex={0}
      >
        {data.length === 0 && (
          <div className="mb-3 rounded-lg border border-dashed border-gray-200 py-6 text-center">
            <p className="text-sm text-gray-500">{t('empty')}</p>
          </div>
        )}
        <div className="grid grid-cols-[50px_repeat(24,1fr)] text-xs" aria-hidden="true">
          <div />
          {HOURS.map(h => (
            <div key={h} className="py-1 text-center text-gray-600">
              {t('hourShort', { hour: h })}
            </div>
          ))}
          {days.map((day, di) => (
            <div key={day} className="contents">
              <div className="flex items-center text-gray-600 font-medium">{day}</div>
              {HOURS.map(h => {
                const intensity = getIntensity(di, h);
                const cell = data.find(d => d.day === di && d.hour === h);
                return (
                  <div
                    key={h}
                    className={cn('aspect-square rounded-sm', getColorClass(intensity))}
                    title={cell ? t('cellLabel', { count: cell.orderCount, day, hour: h }) : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <table className="sr-only">
          <caption>{t('tableLabel')}</caption>
          <thead>
            <tr>
              <th scope="col" />
              {HOURS.map((hour) => <th key={hour} scope="col">{t('hourShort', { hour })}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIndex) => (
              <tr key={day}>
                <th scope="row">{day}</th>
                {HOURS.map((hour) => {
                  const cell = data.find(item => item.day === dayIndex && item.hour === hour);
                  return <td key={hour}>{t('cellLabel', { count: cell?.orderCount ?? 0, day, hour })}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>{t('low')}</span>
        <div className="flex gap-0.5">
          <div className="h-3 w-3 rounded-sm bg-gray-50 border" />
          <div className="h-3 w-3 rounded-sm bg-brand-100" />
          <div className="h-3 w-3 rounded-sm bg-brand-200" />
          <div className="h-3 w-3 rounded-sm bg-brand-300" />
          <div className="h-3 w-3 rounded-sm bg-brand-400" />
          <div className="h-3 w-3 rounded-sm bg-brand-500" />
        </div>
        <span>{t('high')}</span>
      </div>
    </div>
  );
}
