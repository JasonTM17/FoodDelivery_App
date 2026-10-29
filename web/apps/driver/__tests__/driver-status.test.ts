import { describe, expect, it } from 'vitest';
import {
  DRIVER_NEXT_STATUS,
  driverStatusLabel,
  isActiveDriverStatus,
  nextDriverActionLabel,
  nextDriverStatus,
} from '@/lib/driver-status';
import { isPublicPath } from '@/lib/paths';
import { sanitizeNextPath } from '@/lib/redirects';

describe('driver transition map', () => {
  it('mirrors the backend OrderStateMachine driver sequence', () => {
    expect(nextDriverStatus('driver_assigned')).toBe('driver_arriving_restaurant');
    expect(nextDriverStatus('driver_arriving_restaurant')).toBe('picked_up');
    expect(nextDriverStatus('picked_up')).toBe('delivering');
    expect(nextDriverStatus('delivering')).toBe('delivered');
  });

  it('has no transitions the backend does not allow', () => {
    // 'delivered' is terminal for drivers; the customer/system completes it.
    expect(nextDriverStatus('delivered')).toBeNull();
    expect(nextDriverStatus('completed')).toBeNull();
    expect(nextDriverStatus('cancelled')).toBeNull();
    // Drivers may never jump straight to picked_up or delivered.
    expect(Object.values(DRIVER_NEXT_STATUS)).not.toContain('driver_assigned');
    expect(nextDriverStatus('ready_for_pickup')).toBeNull();
  });

  it('labels the next action for each active state', () => {
    expect(nextDriverActionLabel('driver_assigned')).toBe('Head to restaurant');
    expect(nextDriverActionLabel('driver_arriving_restaurant')).toBe('Confirm pickup');
    expect(nextDriverActionLabel('picked_up')).toBe('Start delivery');
    expect(nextDriverActionLabel('delivering')).toBe('Confirm delivery');
    expect(nextDriverActionLabel('delivered')).toBeNull();
  });

  it('identifies active statuses', () => {
    expect(isActiveDriverStatus('delivering')).toBe(true);
    expect(isActiveDriverStatus('delivered')).toBe(false);
    expect(driverStatusLabel('picked_up')).toBe('Picked up');
    expect(driverStatusLabel('weird')).toBe('weird');
    expect(driverStatusLabel('picked_up', 'vi')).toBe('Đã lấy món');
    expect(driverStatusLabel('picked_up', 'ja')).toBe('料理受取済み');
    expect(nextDriverActionLabel('driver_assigned', 'ja')).toBe('レストランへ向かう');
  });
});

describe('auth guard', () => {
  it('only the login path is public', () => {
    expect(isPublicPath('/login')).toBe(true);
    for (const path of ['/', '/dashboard', '/history', '/earnings', '/profile']) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });

  it('sanitizes the next redirect target', () => {
    expect(sanitizeNextPath('/earnings', '/dashboard')).toBe('/earnings');
    expect(sanitizeNextPath('https://evil.example', '/dashboard')).toBe('/dashboard');
    expect(sanitizeNextPath(null, '/dashboard')).toBe('/dashboard');
  });
});
