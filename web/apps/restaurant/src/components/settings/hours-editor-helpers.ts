import type { DayHours, OpeningHours } from '@/lib/types';

export type OpeningHoursDay = keyof OpeningHours;

export interface RestaurantOpeningHourRow {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export const DAY_ORDER: OpeningHoursDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DEFAULT_HOURS: OpeningHours = {
  monday: { open: '08:00', close: '22:00', isClosed: false },
  tuesday: { open: '08:00', close: '22:00', isClosed: false },
  wednesday: { open: '08:00', close: '22:00', isClosed: false },
  thursday: { open: '08:00', close: '22:00', isClosed: false },
  friday: { open: '08:00', close: '22:00', isClosed: false },
  saturday: { open: '09:00', close: '23:00', isClosed: false },
  sunday: { open: '09:00', close: '22:00', isClosed: false },
};

export function fromOpeningHourPayload(payload: unknown): OpeningHours {
  if (Array.isArray(payload)) {
    return payload.reduce<OpeningHours>((acc, row) => {
      if (!isOpeningHourRow(row)) return acc;
      const day = DAY_ORDER[row.dayOfWeek];
      if (!day) return acc;
      acc[day] = {
        open: row.openTime || DEFAULT_HOURS[day].open,
        close: row.closeTime || DEFAULT_HOURS[day].close,
        isClosed: row.isClosed,
      };
      return acc;
    }, cloneDefaultHours());
  }

  if (isOpeningHoursObject(payload)) {
    return DAY_ORDER.reduce<OpeningHours>((acc, day) => {
      acc[day] = { ...DEFAULT_HOURS[day], ...payload[day] };
      return acc;
    }, cloneDefaultHours());
  }

  return cloneDefaultHours();
}

export function toOpeningHourRows(hours: OpeningHours): RestaurantOpeningHourRow[] {
  return DAY_ORDER.map((day, dayOfWeek) => ({
    dayOfWeek,
    openTime: hours[day].open,
    closeTime: hours[day].close,
    isClosed: hours[day].isClosed,
  }));
}

function cloneDefaultHours(): OpeningHours {
  return DAY_ORDER.reduce<OpeningHours>((acc, day) => {
    acc[day] = { ...DEFAULT_HOURS[day] };
    return acc;
  }, {} as OpeningHours);
}

function isOpeningHoursObject(value: unknown): value is OpeningHours {
  if (!value || Array.isArray(value) || typeof value !== 'object') return false;
  return DAY_ORDER.every(day => isDayHours((value as Record<string, unknown>)[day]));
}

function isDayHours(value: unknown): value is DayHours {
  if (!value || typeof value !== 'object') return false;
  const day = value as Partial<DayHours>;
  return typeof day.open === 'string' && typeof day.close === 'string' && typeof day.isClosed === 'boolean';
}

function isOpeningHourRow(value: unknown): value is RestaurantOpeningHourRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<RestaurantOpeningHourRow>;
  return (
    typeof row.dayOfWeek === 'number'
    && typeof row.openTime === 'string'
    && typeof row.closeTime === 'string'
    && typeof row.isClosed === 'boolean'
  );
}
