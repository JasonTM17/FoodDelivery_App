import { describe, expect, it } from 'vitest';
import { resolveGoogleMapsApiKey } from '@/lib/google-maps-key';

describe('admin Google Maps key', () => {
  it('uses the configured public browser key', () => {
    expect(resolveGoogleMapsApiKey({
      NEXT_PUBLIC_GOOGLE_MAPS_KEY: ' prod-google-maps-public-key ',
      VERCEL_ENV: 'production',
    })).toBe('prod-google-maps-public-key');
  });

  it('allows the missing-key guidance state outside production', () => {
    expect(resolveGoogleMapsApiKey({ NODE_ENV: 'development' })).toBe('');
  });

  it('allows the missing-key guidance state for explicit local Docker builds', () => {
    expect(resolveGoogleMapsApiKey({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_ENV: 'development',
    })).toBe('');
  });

  it('fails closed in production when the browser key is not configured', () => {
    expect(() => resolveGoogleMapsApiKey({ VERCEL_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_GOOGLE_MAPS_KEY is required',
    );
  });

  it('also fails closed for non-Vercel production builds', () => {
    expect(() => resolveGoogleMapsApiKey({ NODE_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_GOOGLE_MAPS_KEY is required',
    );
  });

  it('rejects placeholder browser keys in production', () => {
    expect(() => resolveGoogleMapsApiKey({
      NEXT_PUBLIC_GOOGLE_MAPS_KEY: 'your-google-maps-browser-key',
      VERCEL_ENV: 'production',
    })).toThrow('NEXT_PUBLIC_GOOGLE_MAPS_KEY must be configured with a real production value');
  });
});
