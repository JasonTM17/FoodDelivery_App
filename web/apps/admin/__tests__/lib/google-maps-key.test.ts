import { describe, expect, it } from 'vitest';
import { resolveGoogleMapsApiKey } from '@/lib/google-maps-key';

describe('admin Google Maps key', () => {
  it('uses the configured public browser key', () => {
    expect(resolveGoogleMapsApiKey({
      NEXT_PUBLIC_GOOGLE_MAPS_KEY: ' browser-key ',
      NODE_ENV: 'production',
    })).toBe('browser-key');
  });

  it('allows the missing-key guidance state outside production', () => {
    expect(resolveGoogleMapsApiKey({ NODE_ENV: 'development' })).toBe('');
  });

  it('fails closed in production when the browser key is not configured', () => {
    expect(() => resolveGoogleMapsApiKey({ NODE_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_GOOGLE_MAPS_KEY is required',
    );
  });
});
