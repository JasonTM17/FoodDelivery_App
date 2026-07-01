'use client';

import type { StaffShift } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StaffScheduleGridProps {
  shifts: StaffShift[];
  onChange?: (shifts: StaffShift[]) => void;
  readOnly?: boolean;
}

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6h-21h
const HOUR_LABELS = HOURS.map(h => `${h.toString().padStart(2, '0')}:00`);

export function StaffScheduleGrid({ shifts, onChange, readOnly }: StaffScheduleGridProps) {
  const toggleCell = (day: number, hour: number) => {
    if (readOnly || !onChange) return;
    const existing = shifts.find(s => s.day === day && hour >= s.startHour && hour < s.endHour);
    if (existing) {
      onChange(shifts.filter(s => s !== existing));
    } else {
      // Find adjacent cells to extend shift
      const start = hour;
      const end = Math.min(hour + 2, 22); // default 2-hour shift
      // Check for conflicts - if next cell is already assigned, just add 1
      const nextAssigned = shifts.find(s => s.day === day && hour + 1 >= s.startHour && hour + 1 < s.endHour);
      const actualEnd = nextAssigned ? hour + 1 : end;
      onChange([...shifts, { day, startHour: start, endHour: actualEnd }]);
    }
  };

  const isAssigned = (day: number, hour: number): boolean => {
    return shifts.some(s => s.day === day && hour >= s.startHour && hour < s.endHour);
  };

  return (
    <div className="space-y-2" data-testid="staff-schedule-grid">
      <h4 className="text-sm font-semibold text-gray-900">Lịch làm việc</h4>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] text-xs">
          <div />
          {DAYS.map((day) => (
            <div key={day} className="text-center text-gray-500 font-medium py-1">
              {day}
            </div>
          ))}
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="text-right pr-2 py-2 text-gray-400 text-xs">
                {HOUR_LABELS[hour - 6]}
              </div>
              {DAYS.map((_, di) => (
                <button
                  key={`${di}-${hour}`}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleCell(di, hour)}
                  className={cn(
                    'h-8 border border-gray-100 transition-colors',
                    isAssigned(di, hour)
                      ? 'bg-brand-500 hover:bg-brand-600'
                      : 'hover:bg-brand-50',
                    readOnly && 'cursor-default'
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-6 rounded-sm bg-brand-500" />
          <span>Có ca</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-6 rounded-sm border border-gray-100 bg-white" />
          <span>Trống</span>
        </div>
      </div>
    </div>
  );
}
