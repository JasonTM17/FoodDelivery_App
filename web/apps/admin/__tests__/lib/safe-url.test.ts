import { describe, expect, it } from 'vitest';
import { isHttpsUrl } from '@/lib/safe-url';

describe('isHttpsUrl', () => {
  it('allows https URLs only', () => {
    expect(isHttpsUrl('https://cdn.example.com/file.pdf')).toBe(true);
    expect(isHttpsUrl('http://cdn.example.com/file.pdf')).toBe(false);
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpsUrl('//evil.test/x')).toBe(false);
    expect(isHttpsUrl(null)).toBe(false);
    expect(isHttpsUrl('')).toBe(false);
  });
});
