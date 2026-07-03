import { describe, expect, it } from 'vitest'
import { resolveAdminMetadataBase } from '@/lib/metadata-url'

describe('admin metadata base URL', () => {
  it('uses the configured public Admin URL', () => {
    expect(resolveAdminMetadataBase({
      NEXT_PUBLIC_ADMIN_URL: ' https://admin.foodflow.test ',
      NODE_ENV: 'production',
    }).toString()).toBe('https://admin.foodflow.test/')
  })

  it('keeps the localhost default outside production', () => {
    expect(resolveAdminMetadataBase({ NODE_ENV: 'test' }).toString()).toBe('http://localhost:3000/')
  })

  it('fails closed in production when the Admin URL is not configured', () => {
    expect(() => resolveAdminMetadataBase({ NODE_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_ADMIN_URL is required',
    )
  })
})
