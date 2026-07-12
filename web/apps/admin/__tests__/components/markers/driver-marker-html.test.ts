import { describe, expect, it } from 'vitest';
import { buildDriverInfoWindowHtml } from '@/components/markers/driver-marker-html';
import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';

describe('buildDriverInfoWindowHtml', () => {
  it('escapes driver-controlled content before injecting it into a map popup', () => {
    const html = buildDriverInfoWindowHtml(
      makeDriver({
        name: '<img src=x onerror=alert(1)>',
        currentOrder: '<script>alert(1)</script>',
      }),
      '<b>Busy</b>',
      {
        rating: 'Rating',
        status: 'Status',
        order: 'Order',
        vehicle: 'Vehicle',
        lastSeen: 'Last seen',
        stale: 'stale',
      },
    );

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;Busy&lt;/b&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
  });

  it('labels stale driver markers without trusting driver-controlled content', () => {
    const html = buildDriverInfoWindowHtml(
      makeDriver({ isStale: true }),
      'Busy',
      {
        rating: 'Rating',
        status: 'Status',
        order: 'Order',
        vehicle: 'Vehicle',
        lastSeen: 'Last seen',
        stale: 'stale',
      },
    );

    expect(html).toContain('Busy (stale)');
  });
});

function makeDriver(overrides: Partial<DriverLocation> = {}): DriverLocation {
  return {
    id: 'driver-1',
    driverId: 'driver-1',
    name: 'Nguyen Minh',
    rating: 4.8,
    status: 'busy',
    lat: 10.7769,
    lng: 106.7009,
    vehicleType: 'motorbike',
    vehiclePlate: '59-A1 12345',
    currentOrder: 'ORD-1',
    lastSeenAt: '2026-07-02T08:30:00.000Z',
    ...overrides,
  };
}
