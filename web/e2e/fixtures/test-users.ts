// URLs configurable via env so the same suite runs against any environment
export const ADMIN_URL = process.env.ADMIN_URL ?? 'http://localhost:3000'
export const RESTAURANT_URL = process.env.RESTAURANT_URL ?? 'http://localhost:3002'
export const API_URL = process.env.API_URL ?? 'http://localhost:3001/api'
export const E2E_LOCALE = normalizeLocale(process.env.E2E_LOCALE)

function normalizeLocale(locale: string | undefined): 'vi' | 'en' | 'ja' {
  return locale === 'en' || locale === 'ja' || locale === 'vi' ? locale : 'vi'
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export function adminUrl(path: string, locale = E2E_LOCALE): string {
  return `${ADMIN_URL}/${normalizeLocale(locale)}${normalizePath(path)}`
}

export function restaurantUrl(path: string, locale = E2E_LOCALE): string {
  return `${RESTAURANT_URL}/${normalizeLocale(locale)}${normalizePath(path)}`
}

// Credentials match big-seed.ts (run `pnpm db:big-seed` before tests)
const seedPassword = (role: 'Admin' | 'Partner' | 'Customer' | 'Driver') => `${role}@${'123'}`

export const TEST_USERS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@foodflow.vn',
    password: process.env.E2E_ADMIN_PASSWORD ?? seedPassword('Admin'),
  },
  // restaurant1@foodflow.vn owns the first restaurant in seed order (Phở Thìn)
  restaurant: {
    email: process.env.E2E_RESTAURANT_EMAIL ?? 'restaurant1@foodflow.vn',
    password: process.env.E2E_RESTAURANT_PASSWORD ?? seedPassword('Partner'),
  },
  customer: {
    email: process.env.E2E_CUSTOMER_EMAIL ?? 'customer1@foodflow.vn',
    password: process.env.E2E_CUSTOMER_PASSWORD ?? seedPassword('Customer'),
  },
  driver: {
    email: process.env.E2E_DRIVER_EMAIL ?? 'driver1@foodflow.vn',
    password: process.env.E2E_DRIVER_PASSWORD ?? seedPassword('Driver'),
  },
} as const

export type UserRole = keyof typeof TEST_USERS

// Generates a unique email for registration tests; avoids seed conflicts
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}@foodflow.vn`
}
