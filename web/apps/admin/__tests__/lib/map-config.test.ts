import { describe, expect, it } from 'vitest';
import { DEFAULT_OPENFREEMAP_STYLE_URL, resolvePublicMapConfig } from '@/lib/map-config';

describe('admin public map configuration', () => {
  it('uses the no-key OpenFreeMap defaults outside production', () => {
    expect(resolvePublicMapConfig({ NODE_ENV: 'development' })).toEqual({
      provider: 'openfreemap',
      styleUrl: DEFAULT_OPENFREEMAP_STYLE_URL,
    });
  });

  it('accepts an explicit HTTPS OpenFreeMap style in production', () => {
    expect(resolvePublicMapConfig({
      NEXT_PUBLIC_MAP_PROVIDER: ' openfreemap ',
      NEXT_PUBLIC_MAP_STYLE_URL: 'https://tiles.openfreemap.org/styles/liberty',
      VERCEL_ENV: 'production',
    })).toEqual({
      provider: 'openfreemap',
      styleUrl: DEFAULT_OPENFREEMAP_STYLE_URL,
    });
  });

  it('fails closed when production configuration is incomplete', () => {
    expect(() => resolvePublicMapConfig({ VERCEL_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_MAP_PROVIDER is required',
    );
    expect(() => resolvePublicMapConfig({
      NEXT_PUBLIC_MAP_PROVIDER: 'openfreemap',
      VERCEL_ENV: 'production',
    })).toThrow('NEXT_PUBLIC_MAP_STYLE_URL is required');
  });

  it('rejects unsupported, insecure, local, and placeholder production styles', () => {
    expect(() => resolvePublicMapConfig({
      NEXT_PUBLIC_MAP_PROVIDER: 'google',
      NEXT_PUBLIC_MAP_STYLE_URL: DEFAULT_OPENFREEMAP_STYLE_URL,
      VERCEL_ENV: 'production',
    })).toThrow('NEXT_PUBLIC_MAP_PROVIDER must be openfreemap');
    expect(() => resolvePublicMapConfig({
      NEXT_PUBLIC_MAP_PROVIDER: 'openfreemap',
      NEXT_PUBLIC_MAP_STYLE_URL: 'http://localhost:8080/style.json',
      VERCEL_ENV: 'production',
    })).toThrow('NEXT_PUBLIC_MAP_STYLE_URL must be a secure public URL');
    expect(() => resolvePublicMapConfig({
      NEXT_PUBLIC_MAP_PROVIDER: 'openfreemap',
      NEXT_PUBLIC_MAP_STYLE_URL: 'https://example.com/style.json',
      VERCEL_ENV: 'production',
    })).toThrow('NEXT_PUBLIC_MAP_STYLE_URL must be configured with a real production value');
    expect(() => resolvePublicMapConfig({
      NEXT_PUBLIC_MAP_PROVIDER: 'openfreemap',
      NEXT_PUBLIC_MAP_STYLE_URL: 'https://tiles.openfreemap.org@evil.invalid/styles/liberty',
      VERCEL_ENV: 'production',
    })).toThrow('must be a credential-free OpenFreeMap style URL');
  });
});
