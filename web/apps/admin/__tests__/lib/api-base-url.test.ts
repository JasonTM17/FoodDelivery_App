import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from '@/lib/api-base-url';

describe('admin API base URL', () => {
  it('uses the configured public API URL', () => {
    expect(resolveApiBaseUrl({
      NEXT_PUBLIC_API_URL: ' https://api.foodflow.test/admin ',
      NODE_ENV: 'production',
    })).toBe('https://api.foodflow.test/admin');
  });

  it('keeps the localhost default for local development', () => {
    expect(resolveApiBaseUrl({ NODE_ENV: 'development' })).toBe('http://localhost:3001/api');
  });

  it('fails closed in production when the API URL is not configured', () => {
    expect(() => resolveApiBaseUrl({ NODE_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_API_URL is required',
    );
  });
});
