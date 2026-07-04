/**
 * k6-helpers.js — Shared auth helpers and test fixtures for FoodFlow k6 load tests.
 *
 * Credentials match pnpm db:big-seed (see web/e2e/fixtures/test-users.ts).
 * Import this module from k6 scenario files.
 */

import { check } from 'k6'
import http from 'k6/http'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Base API URL — override via K6_ENV_API_URL environment variable */
export const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api'

// ---------------------------------------------------------------------------
// Seed credentials (must match pnpm db:big-seed output)
// ---------------------------------------------------------------------------

const seedPassword = (role) => `${role}@${'123'}`

export const CREDENTIALS = {
  customer: {
    email: __ENV.CUSTOMER_EMAIL || 'customer1@foodflow.vn',
    password: __ENV.CUSTOMER_PASSWORD || seedPassword('Customer'),
  },
  restaurant: {
    email: __ENV.RESTAURANT_EMAIL || 'restaurant1@foodflow.vn',
    password: __ENV.RESTAURANT_PASSWORD || seedPassword('Partner'),
  },
  driver: {
    email: __ENV.DRIVER_EMAIL || 'driver1@foodflow.vn',
    password: __ENV.DRIVER_PASSWORD || seedPassword('Driver'),
  },
  admin: {
    email: __ENV.ADMIN_EMAIL || 'admin@foodflow.vn',
    password: __ENV.ADMIN_PASSWORD || seedPassword('Admin'),
  },
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Login a role and return { accessToken, userId, restaurantId }.
 * Called from k6 setup() — runs once before VUs start.
 *
 * @param {'customer'|'restaurant'|'driver'|'admin'} role
 * @returns {{ accessToken: string, userId: string, restaurantId: string }}
 */
export function login(role, overrides = {}) {
  const base = CREDENTIALS[role]
  if (!base && !overrides.email) throw new Error(`k6-helpers: unknown role "${role}"`)
  const creds = { ...(base || {}), ...overrides }

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify(creds),
    { headers: { 'Content-Type': 'application/json' } },
  )
  check(res, { [`login(${role}) 200`]: (r) => r.status === 200 })

  const body = responseData(res) || {}
  const user = body.user || {}
  return {
    accessToken: body.accessToken ?? '',
    userId: user.id ?? '',
    restaurantId: user.restaurantId ?? body.restaurantId ?? '',
  }
}

export function responseData(res) {
  try {
    const body = res.json()
    if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'data')) {
      return body.data
    }
    return body
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

/**
 * Returns k6 request params with Authorization + JSON Content-Type.
 *
 * @param {string} token
 * @returns {import('k6/http').Params}
 */
export function authHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Well-known IDs from db:big-seed.
 * Override via env vars if your seed output differs.
 */
export const FIXTURES = {
  restaurantId: __ENV.FIXTURE_RESTAURANT_ID || '',
  menuItemId: __ENV.FIXTURE_MENU_ITEM_ID || '',
  addressId: __ENV.FIXTURE_ADDRESS_ID || '',
  deliveryAddress: '1 Nguyễn Huệ, Quận 1, TP. HCM',
  deliveryLat: 10.7757,
  deliveryLng: 106.7004,
}

/**
 * Resolves restaurantId and menuItemId from the API using the restaurant token.
 * Call from k6 setup() after login.
 *
 * @param {string} restaurantToken
 * @returns {{ restaurantId: string, menuItemId: string }}
 */
export function resolveFixtures(restaurantToken) {
  let restaurantId = FIXTURES.restaurantId
  let menuItemId = FIXTURES.menuItemId

  // Resolve restaurant ID
  const restRes = http.get(`${BASE_URL}/restaurant/profile`, {
    headers: { Authorization: `Bearer ${restaurantToken}` },
  })
  if (restRes.status === 200) {
    const body = responseData(restRes)
    restaurantId = body?.id ?? body?.restaurantId ?? body?.restaurant?.id ?? restaurantId
  }

  // Resolve first menu item
  if (restaurantId) {
    const menuRes = http.get(`${BASE_URL}/restaurants/${restaurantId}/menu`)
    if (menuRes.status === 200) {
      const body = responseData(menuRes)
      const cats = Array.isArray(body) ? body : (body.categories ?? [])
      menuItemId = cats[0]?.menuItems?.[0]?.id ?? cats[0]?.items?.[0]?.id ?? menuItemId
    }
  }

  return { restaurantId, menuItemId }
}

export function resolveCustomerAddress(customerToken) {
  if (FIXTURES.addressId) return FIXTURES.addressId

  const ordersRes = http.get(`${BASE_URL}/orders?page=1&limit=1`, authHeaders(customerToken))
  if (ordersRes.status !== 200) return ''

  const ordersPayload = responseData(ordersRes)
  const orders = Array.isArray(ordersPayload)
    ? ordersPayload
    : (ordersPayload?.orders ?? ordersPayload?.items ?? [])
  const orderId = orders[0]?.id
  if (!orderId) return ''

  const detailRes = http.get(`${BASE_URL}/orders/${orderId}`, authHeaders(customerToken))
  if (detailRes.status !== 200) return ''

  const detail = responseData(detailRes)
  return detail?.deliveryAddress?.id ?? detail?.deliveryAddressId ?? ''
}
