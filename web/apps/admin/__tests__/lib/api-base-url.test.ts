import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from '@/lib/api-base-url';

describe('admin API base URL', () => {
  it('uses the configured public API URL', () => {
    expect(resolveApiBaseUrl({
      NEXT_PUBLIC_API_URL: ' https://api.foodflow.test/admin ',
      VERCEL_ENV: 'production',
    })).toBe('https://api.foodflow.test/admin');
  });

  it('keeps the localhost default for local development', () => {
    expect(resolveApiBaseUrl({ NODE_ENV: 'development' })).toBe('http://localhost:3001/api');
  });

  it('keeps the localhost default for explicit local Docker builds', () => {
    expect(resolveApiBaseUrl({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'development',
    })).toBe('http://localhost:3001/api');
  });

  it('fails closed in production when the API URL is not configured', () => {
    expect(() => resolveApiBaseUrl({ VERCEL_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_API_URL is required',
    );
  });

  it('also fails closed for non-Vercel production builds', () => {
    expect(() => resolveApiBaseUrl({ NODE_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_API_URL is required',
    );
  });

  it('rejects localhost API URLs in production', () => {
    expect(() => resolveApiBaseUrl({
      NEXT_PUBLIC_API_URL: 'http://localhost:3001/api',
      VERCEL_ENV: 'production',
    })).toThrow('NEXT_PUBLIC_API_URL must be a secure public URL');
  });
});
