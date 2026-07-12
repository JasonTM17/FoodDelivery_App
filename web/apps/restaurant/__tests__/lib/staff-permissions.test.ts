import { describe, expect, it } from 'vitest';
import {
  canAccessPath,
  hasCapability,
  resolveStaffPermissions,
} from '@/lib/staff-permissions';

describe('staff-permissions', () => {
  it('resolves defaults by staff role', () => {
    expect(resolveStaffPermissions('kitchen')).toEqual(['orders']);
    expect(resolveStaffPermissions('viewer')).toEqual(['reports']);
    expect(resolveStaffPermissions('owner')).toContain('staff');
  });

  it('prefers explicit permissions over role defaults', () => {
    expect(resolveStaffPermissions('kitchen', ['orders', 'menu'])).toEqual(['orders', 'menu']);
  });

  it('drops unknown explicit capabilities at the parsing boundary', () => {
    expect(resolveStaffPermissions('manager', ['orders', 'billing', 'staff'])).toEqual([
      'orders',
      'staff',
    ]);
  });

  it('gates nav paths by capability', () => {
    const kitchen = resolveStaffPermissions('kitchen');
    expect(canAccessPath(kitchen, '/orders')).toBe(true);
    expect(canAccessPath(kitchen, '/menu')).toBe(false);
    expect(canAccessPath(kitchen, '/staff')).toBe(false);
    expect(canAccessPath(kitchen, '/')).toBe(true);
    expect(canAccessPath(kitchen, '/notifications')).toBe(true);

    const manager = resolveStaffPermissions('manager');
    expect(canAccessPath(manager, '/promotions')).toBe(true);
    expect(canAccessPath(manager, '/settings/hours')).toBe(true);
  });

  it('treats null capability as always allowed', () => {
    expect(hasCapability([], null)).toBe(true);
    expect(hasCapability(['orders'], 'menu')).toBe(false);
  });
});
