import { describe, expect, it } from 'vitest';
import { fromOpeningHourPayload, toOpeningHourRows } from '@/components/settings/hours-editor-helpers';

describe('hours editor helpers', () => {
  it('hydrates backend opening-hour rows into the editor shape', () => {
    const hours = fromOpeningHourPayload([
      { dayOfWeek: 0, openTime: '07:00', closeTime: '21:00', isClosed: false },
      { dayOfWeek: 6, openTime: '10:00', closeTime: '16:00', isClosed: true },
    ]);

    expect(hours.monday).toEqual({ open: '07:00', close: '21:00', isClosed: false });
    expect(hours.sunday).toEqual({ open: '10:00', close: '16:00', isClosed: true });
    expect(hours.tuesday).toEqual({ open: '08:00', close: '22:00', isClosed: false });
  });

  it('serializes the editor shape into the backend contract', () => {
    const rows = toOpeningHourRows(fromOpeningHourPayload({
      monday: { open: '06:30', close: '22:00', isClosed: false },
      tuesday: { open: '08:00', close: '22:00', isClosed: false },
      wednesday: { open: '08:00', close: '22:00', isClosed: false },
      thursday: { open: '08:00', close: '22:00', isClosed: false },
      friday: { open: '08:00', close: '22:00', isClosed: false },
      saturday: { open: '09:00', close: '23:00', isClosed: false },
      sunday: { open: '09:00', close: '22:00', isClosed: false },
    }));

    expect(rows[0]).toEqual({ dayOfWeek: 0, openTime: '06:30', closeTime: '22:00', isClosed: false });
    expect(rows).toHaveLength(7);
  });
});
