import { resolvePublicAuthThrottleLimit } from './auth-throttle'

describe('resolvePublicAuthThrottleLimit', () => {
  it('keeps the strict default in production', () => {
    expect(
      resolvePublicAuthThrottleLimit(5, {
        NODE_ENV: 'production',
        AUTH_PUBLIC_THROTTLE_LIMIT: '500',
      }),
    ).toBe(5)
  })

  it('allows a bounded non-production override for e2e runs', () => {
    expect(
      resolvePublicAuthThrottleLimit(5, {
        NODE_ENV: 'development',
        AUTH_PUBLIC_THROTTLE_LIMIT: '500',
      }),
    ).toBe(500)
  })

  it('falls back to the default for invalid overrides', () => {
    expect(
      resolvePublicAuthThrottleLimit(5, {
        NODE_ENV: 'test',
        AUTH_PUBLIC_THROTTLE_LIMIT: 'not-a-number',
      }),
    ).toBe(5)
  })
})
