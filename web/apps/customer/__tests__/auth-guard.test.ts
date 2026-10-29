import { describe, expect, it } from 'vitest';
import { isPublicPath } from '@/lib/paths';
import { sanitizeNextPath } from '@/lib/redirects';

describe('isPublicPath', () => {
  it('treats browsing and auth pages as public', () => {
    for (const path of ['/', '/home', '/login', '/register', '/restaurants/r1', '/cart']) {
      expect(isPublicPath(path), path).toBe(true);
    }
  });

  it('treats account and checkout pages as protected', () => {
    for (const path of ['/checkout', '/orders', '/orders/abc', '/addresses', '/profile']) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });
});

describe('sanitizeNextPath', () => {
  it('allows same-origin paths', () => {
    expect(sanitizeNextPath('/orders/123')).toBe('/orders/123');
    expect(sanitizeNextPath(' /cart ')).toBe('/cart');
  });

  it('blocks external and protocol-relative targets', () => {
    expect(sanitizeNextPath('https://evil.example/x')).toBe('/home');
    expect(sanitizeNextPath('//evil.example')).toBe('/home');
    expect(sanitizeNextPath('javascript:alert(1)')).toBe('/home');
    expect(sanitizeNextPath('\\\\server\\share')).toBe('/home');
  });

  it('falls back on empty input', () => {
    expect(sanitizeNextPath(null)).toBe('/home');
    expect(sanitizeNextPath('')).toBe('/home');
    expect(sanitizeNextPath('   ')).toBe('/home');
  });
});
