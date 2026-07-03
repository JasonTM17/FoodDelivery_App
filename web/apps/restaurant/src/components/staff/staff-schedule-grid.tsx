'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { addDays, addHours, startOfWeek } from 'date-fns';
import type { StaffShift } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface StaffShiftToggle {
  shiftId?: string;
  startsAt: string;
  endsAt: string;
}

interface StaffScheduleGridProps {
  shifts: StaffShift[];
  busy?: boolean;
  readOnly?: boolean;
  onToggle?: (change: StaffShiftToggle) => Promise<void>;
}

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const hours = Array.from({ length: 16 }, (_, index) => index + 6);
const hourLabels = hours.map(hour => `${hour.toString().padStart(2, '0')}:00`);
const dateLocales: Record<string, string> = { en: 'en-US', ja: 'ja-JP', vi: 'vi-VN' };

export function StaffScheduleGrid({
  shifts,
  busy = false,
  readOnly = false,
  onToggle,
}: StaffScheduleGridProps) {
  const t = useTranslations('staff');
  const locale = useLocale();
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(dateLocales[locale] ?? 'vi-VN', { day: '2-digit', month: '2-digit' }),
    [locale],
  );

  const getSlot = (dayIndex: number, hour: number) => {
    const startsAt = addHours(addDays(weekStart, dayIndex), hour);
    const endsAt = addHours(startsAt, 1);
    const shift = shifts.find((item) => {
      if (item.status !== 'scheduled') return false;
      const shiftStart = new Date(item.startsAt);
      const shiftEnd = new Date(item.endsAt);
      return shiftStart < endsAt && shiftEnd > startsAt;
    });
    return { shift, startsAt, endsAt };
  };

  const toggleCell = async (dayIndex: number, hour: number) => {
    if (readOnly || busy || !onToggle) return;
    const slot = getSlot(dayIndex, hour);
    await onToggle({
      shiftId: slot.shift?.id,
      startsAt: slot.startsAt.toISOString(),
      endsAt: slot.endsAt.toISOString(),
    });
  };

  return (
    <div className="space-y-3" data-testid="staff-schedule-grid" aria-busy={busy}>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{t('schedule.title')}</h3>
        <p className="mt-1 text-xs text-gray-500">{t('schedule.description')}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div className="grid min-w-[760px] grid-cols-[64px_repeat(7,1fr)] text-xs">
          <div className="border-b border-r border-gray-100 bg-gray-50" />
          {days.map((day, dayIndex) => (
            <div key={day} className="border-b border-r border-gray-100 bg-gray-50 py-2 text-center font-medium text-gray-600 last:border-r-0">
              <span className="block">{t(`schedule.days.${day}`)}</span>
              <span className="font-normal text-gray-400">{dayFormatter.format(addDays(weekStart, dayIndex))}</span>
            </div>
          ))}
          {hours.map(hour => (
            <div key={hour} className="contents">
              <div className="border-b border-r border-gray-100 py-2 pr-2 text-right text-gray-400">
                {hourLabels[hour - 6]}
              </div>
              {days.map((day, dayIndex) => {
                const slot = getSlot(dayIndex, hour);
                const assigned = Boolean(slot.shift);
                return (
                  <button
                    key={`${day}-${hour}`}
                    type="button"
                    disabled={readOnly || busy}
                    onClick={() => void toggleCell(dayIndex, hour)}
                    className={cn(
                      'h-8 border-b border-r border-gray-100 transition-colors last:border-r-0',
                      assigned ? 'bg-brand-500 hover:bg-brand-600' : 'bg-white hover:bg-brand-50',
                      (readOnly || busy) && 'cursor-not-allowed opacity-70',
                    )}
                    aria-pressed={assigned}
                    aria-label={t('schedule.toggleSlot', {
                      day: t(`schedule.days.${day}`),
                      hour: hourLabels[hour - 6],
                    })}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-6 rounded-sm bg-brand-500" />
          <span>{t('schedule.assigned')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-6 rounded-sm border border-gray-100 bg-white" />
          <span>{t('schedule.empty')}</span>
        </div>
      </div>
    </div>
  );
}
