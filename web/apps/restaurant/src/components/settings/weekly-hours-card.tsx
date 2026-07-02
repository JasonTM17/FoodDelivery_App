'use client';

import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { DayHours, OpeningHours } from '@/lib/types';
import { DAY_ORDER, type OpeningHoursDay } from './hours-editor-helpers';

interface WeeklyHoursCardProps {
  hours: OpeningHours;
  onUpdateHour: (day: OpeningHoursDay, field: keyof DayHours, value: string | boolean) => void;
  onCopyToAll: (day: OpeningHoursDay) => void;
}

export function WeeklyHoursCard({ hours, onUpdateHour, onCopyToAll }: WeeklyHoursCardProps) {
  const t = useTranslations('settings.hoursEditor');

  return (
    <div className="card mb-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{t('weekly.title')}</h2>
      <div className="space-y-1">
        {DAY_ORDER.map((day) => {
          const dayHours = hours[day];
          return (
            <div
              key={day}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-lg px-3 py-3 transition-colors',
                dayHours.isClosed ? 'bg-gray-50' : 'hover:bg-gray-50/50',
              )}
            >
              <span className={cn('w-24 shrink-0 text-sm font-medium', dayHours.isClosed ? 'text-gray-400' : 'text-gray-700')}>
                {t(`days.${day}`)}
              </span>
              <label className="flex min-w-[90px] cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={!dayHours.isClosed}
                  onChange={(event) => onUpdateHour(day, 'isClosed', !event.target.checked)}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className={cn('text-sm', dayHours.isClosed ? 'text-gray-400' : 'text-gray-600')}>
                  {dayHours.isClosed ? t('weekly.closed') : t('weekly.open')}
                </span>
              </label>
              {!dayHours.isClosed && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={dayHours.open}
                      onChange={(event) => onUpdateHour(day, 'open', event.target.value)}
                      className="input-field w-32"
                      aria-label={t('weekly.openTime', { day: t(`days.${day}`) })}
                    />
                    <span className="text-sm text-gray-400">→</span>
                    <input
                      type="time"
                      value={dayHours.close}
                      onChange={(event) => onUpdateHour(day, 'close', event.target.value)}
                      className="input-field w-32"
                      aria-label={t('weekly.closeTime', { day: t(`days.${day}`) })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopyToAll(day)}
                    className="ml-auto flex items-center gap-1.5 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t('weekly.copyAll')}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
