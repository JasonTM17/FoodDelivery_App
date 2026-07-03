import { describe, expect, it } from 'vitest';
import { isAdminPublicPath } from '@/lib/public-routes';

describe('admin public auth routes', () => {
  it('allows unauthenticated access to password recovery pages', () => {
    expect(isAdminPublicPath('/login')).toBe(true);
    expect(isAdminPublicPath('/vi/forgot-password')).toBe(true);
    expect(isAdminPublicPath('/en/reset-password')).toBe(true);
    expect(isAdminPublicPath('/ja/reset-password')).toBe(true);
  });

  it('keeps authenticated admin sections protected', () => {
    expect(isAdminPublicPath('/overview')).toBe(false);
    expect(isAdminPublicPath('/vi/overview')).toBe(false);
    expect(isAdminPublicPath('/en/settings')).toBe(false);
  });
});
