import { describe, expect, it } from 'vitest';
import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';
import { findSelectedDriver } from '@/app/[locale]/drivers/map/driver-map-selection';

describe('driver map selection', () => {
  it('derives the selected driver from the latest realtime driver list', () => {
    const freshDriver = makeDriver({
      lat: 10.81,
      lng: 106.72,
      status: 'delivering',
      currentOrder: 'FF-20260706',
      lastSeenAt: '2026-07-06T01:20:00.000Z',
    });

    expect(findSelectedDriver([freshDriver], 'driver-1')).toBe(freshDriver);
    expect(findSelectedDriver([freshDriver], 'user-driver-1')).toBe(freshDriver);
  });

  it('clears the card when the selected driver leaves the live driver list', () => {
    expect(findSelectedDriver([makeDriver()], 'missing-driver')).toBeNull();
  });
});

function makeDriver(overrides: Partial<DriverLocation> = {}): DriverLocation {
  return {
    id: 'driver-1',
    driverId: 'user-driver-1',
    name: 'Nguyen Minh',
    rating: 4.8,
    status: 'online',
    lat: 10.7769,
    lng: 106.7009,
    vehicleType: 'motorbike',
    vehiclePlate: '59-A1 12345',
    lastSeenAt: '2026-07-06T01:00:00.000Z',
    ...overrides,
  };
}
