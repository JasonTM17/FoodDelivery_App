'use client';

import { useTranslations } from 'next-intl';
import type { StaffShift } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StaffScheduleGridProps {
  shifts: StaffShift[];
  onChange?: (shifts: StaffShift[]) => void;
  readOnly?: boolean;
}

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const hours = Array.from({ length: 16 }, (_, index) => index + 6);
const hourLabels = hours.map(hour => `${hour.toString().padStart(2, '0')}:00`);

export function StaffScheduleGrid({ shifts, onChange, readOnly }: StaffScheduleGridProps) {
  const t = useTranslations('staff');

  const toggleCell = (day: number, hour: number) => {
    if (readOnly || !onChange) return;
    const existing = shifts.find(shift => shift.day === day && hour >= shift.startHour && hour < shift.endHour);
    if (existing) {
      onChange(shifts.filter(shift => shift !== existing));
      return;
    }

    const end = Math.min(hour + 2, 22);
    const nextAssigned = shifts.find(shift => shift.day === day && hour + 1 >= shift.startHour && hour + 1 < shift.endHour);
    onChange([...shifts, { day, startHour: hour, endHour: nextAssigned ? hour + 1 : end }]);
  };

  const isAssigned = (day: number, hour: number): boolean => (
    shifts.some(shift => shift.day === day && hour >= shift.startHour && hour < shift.endHour)
  );

  return (
    <div className="space-y-2" data-testid="staff-schedule-grid">
      <h4 className="text-sm font-semibold text-gray-900">{t('schedule.title')}</h4>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] text-xs">
          <div />
          {days.map(day => <div key={day} className="py-1 text-center font-medium text-gray-500">{t(`schedule.days.${day}`)}</div>)}
          {hours.map(hour => (
            <div key={hour} className="contents">
              <div className="py-2 pr-2 text-right text-xs text-gray-400">{hourLabels[hour - 6]}</div>
              {days.map((_, dayIndex) => (
                <button
                  key={`${dayIndex}-${hour}`}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleCell(dayIndex, hour)}
                  className={cn(
                    'h-8 border border-gray-100 transition-colors',
                    isAssigned(dayIndex, hour) ? 'bg-brand-500 hover:bg-brand-600' : 'hover:bg-brand-50',
                    readOnly && 'cursor-default',
                  )}
                  aria-label={t('schedule.toggleSlot', { day: t(`schedule.days.${days[dayIndex]}`), hour: hourLabels[hour - 6] })}
                />
              ))}
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
