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

export function fromOpeningHourPayload(payload: unknown): OpeningHours | null {
  if (Array.isArray(payload)) {
    if (payload.length !== DAY_ORDER.length) return null;
    const seenDays = new Set<OpeningHoursDay>();
    const hours = {} as OpeningHours;

    for (const row of payload) {
      if (!isOpeningHourRow(row)) return null;
      const day = DAY_ORDER[row.dayOfWeek];
      if (!day || seenDays.has(day)) return null;
      seenDays.add(day);
      hours[day] = {
        open: row.openTime.trim(),
        close: row.closeTime.trim(),
        isClosed: row.isClosed,
      };
    }

    return seenDays.size === DAY_ORDER.length ? hours : null;
  }

  if (isOpeningHoursObject(payload)) {
    return DAY_ORDER.reduce<OpeningHours>((acc, day) => {
      const dayHours = payload[day];
      acc[day] = {
        open: dayHours.open.trim(),
        close: dayHours.close.trim(),
        isClosed: dayHours.isClosed,
      };
      return acc;
    }, {} as OpeningHours);
  }

  return null;
}

export function toOpeningHourRows(hours: OpeningHours): RestaurantOpeningHourRow[] {
  return DAY_ORDER.map((day, dayOfWeek) => ({
    dayOfWeek,
    openTime: hours[day].open,
    closeTime: hours[day].close,
    isClosed: hours[day].isClosed,
  }));
}

function isOpeningHoursObject(value: unknown): value is OpeningHours {
  if (!value || Array.isArray(value) || typeof value !== 'object') return false;
  return DAY_ORDER.every(day => isDayHours((value as Record<string, unknown>)[day]));
}

function isDayHours(value: unknown): value is DayHours {
  if (!value || typeof value !== 'object') return false;
  const day = value as Partial<DayHours>;
  return isNonEmptyString(day.open) && isNonEmptyString(day.close) && typeof day.isClosed === 'boolean';
}

function isOpeningHourRow(value: unknown): value is RestaurantOpeningHourRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<RestaurantOpeningHourRow>;
  return (
    Number.isInteger(row.dayOfWeek)
    && typeof row.dayOfWeek === 'number'
    && row.dayOfWeek >= 0
    && row.dayOfWeek < DAY_ORDER.length
    && isNonEmptyString(row.openTime)
    && isNonEmptyString(row.closeTime)
    && typeof row.isClosed === 'boolean'
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
