// URLs configurable via env so the same suite runs against any environment
export const ADMIN_URL = process.env.ADMIN_URL ?? 'http://localhost:3000'
export const RESTAURANT_URL = process.env.RESTAURANT_URL ?? 'http://localhost:3002'
export const API_URL = process.env.API_URL ?? 'http://localhost:3001/api'

// Credentials match big-seed.ts (run `pnpm db:big-seed` before tests)
export const TEST_USERS = {
  admin: {
    email: 'admin@foodflow.vn',
    password: 'Admin@123',
  },
  // restaurant1@foodflow.vn owns the first restaurant in seed order (Phở Thìn)
  restaurant: {
    email: 'restaurant1@foodflow.vn',
    password: 'Partner@123',
  },
  customer: {
    email: 'customer1@foodflow.vn',
    password: 'Customer@123',
  },
  driver: {
    email: 'driver1@foodflow.vn',
    password: 'Driver@123',
  },
} as const

export type UserRole = keyof typeof TEST_USERS

// Generates a unique email for registration tests; avoids seed conflicts
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}@foodflow.vn`
}
