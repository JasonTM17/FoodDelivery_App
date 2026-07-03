import { describe, expect, it } from 'vitest';
import type { AdminDriverLocation } from '@foodflow/api-client';
import { buildDriverInfoWindowHtml } from '@/components/markers/driver-marker-html';

describe('buildDriverInfoWindowHtml', () => {
  it('escapes driver-controlled content before injecting it into a Google Maps InfoWindow', () => {
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
      },
    );

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;Busy&lt;/b&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
  });
});

function makeDriver(overrides: Partial<AdminDriverLocation> = {}): AdminDriverLocation {
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
