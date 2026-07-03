import { describe, expect, it } from 'vitest'
import { resolveRestaurantMetadataBase } from '@/lib/metadata-url'

describe('restaurant metadata base URL', () => {
  it('uses the configured public Restaurant URL', () => {
    expect(resolveRestaurantMetadataBase({
      NEXT_PUBLIC_RESTAURANT_URL: ' https://restaurant.foodflow.test ',
      NODE_ENV: 'production',
    }).toString()).toBe('https://restaurant.foodflow.test/')
  })

  it('keeps the localhost default outside production', () => {
    expect(resolveRestaurantMetadataBase({ NODE_ENV: 'test' }).toString()).toBe('http://localhost:3002/')
  })

  it('fails closed in production when the Restaurant URL is not configured', () => {
    expect(() => resolveRestaurantMetadataBase({ NODE_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_RESTAURANT_URL is required',
    )
  })
})
