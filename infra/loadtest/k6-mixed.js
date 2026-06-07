/**
 * k6-mixed.js — FoodFlow mixed load test
 *
 * Target: 100 RPS sustained for 5 minutes
 *   60% customer flow  (browse → menu → checkout)
 *   30% restaurant flow (orders list + status update)
 *   10% driver flow    (location ping + accept offer)
 *
 * Thresholds:
 *   p95 request duration < 500 ms
 *   error rate < 1%
 *
 * Run:
 *   k6 run infra/loadtest/k6-mixed.js --env API_URL=http://localhost:3001/api
 */

import { check, sleep } from 'k6'
import http from 'k6/http'
import { Counter, Rate, Trend } from 'k6/metrics'
import {
  BASE_URL,
  FIXTURES,
  login,
  authHeaders,
  resolveFixtures,
} from './k6-helpers.js'

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const errorRate = new Rate('errors')
const orderPlaceDuration = new Trend('order_place_duration_ms', true)
const statusUpdateDuration = new Trend('status_update_duration_ms', true)
const locationPingDuration = new Trend('location_ping_duration_ms', true)
const orderCount = new Counter('orders_placed')

// ---------------------------------------------------------------------------
// k6 options — three constant-arrival-rate scenarios summing to 100 RPS
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    customer_flow: {
      executor: 'constant-arrival-rate',
      rate: 60,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 80,
      maxVUs: 200,
      exec: 'customerFlow',
    },
    restaurant_flow: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 40,
      maxVUs: 100,
      exec: 'restaurantFlow',
    },
    driver_flow: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 15,
      maxVUs: 40,
      exec: 'driverFlow',
    },
  },

  thresholds: {
    // Global latency gate
    http_req_duration: ['p(95)<500'],
    // k6 built-in failure rate
    http_req_failed: ['rate<0.01'],
    // Custom error counter
    errors: ['rate<0.01'],
    // Per-operation latency targets (informational, not hard gates)
    order_place_duration_ms: ['p(95)<800'],
    location_ping_duration_ms: ['p(95)<200'],
  },
}

// ---------------------------------------------------------------------------
// setup() — runs once, resolves tokens + fixture IDs
// ---------------------------------------------------------------------------

export function setup() {
  const customer = login('customer')
  const restaurant = login('restaurant')
  const driver = login('driver')

  const { restaurantId, menuItemId } = resolveFixtures(restaurant.accessToken)

  return {
    customerToken: customer.accessToken,
    restaurantToken: restaurant.accessToken,
    driverToken: driver.accessToken,
    restaurantId,
    menuItemId,
  }
}

// ---------------------------------------------------------------------------
// Customer flow: browse → menu → place order
// ---------------------------------------------------------------------------

export function customerFlow(data) {
  const { customerToken, restaurantId, menuItemId } = data
  const hdrs = authHeaders(customerToken)

  // Browse restaurant list
  const browseRes = http.get(`${BASE_URL}/restaurants?page=1&limit=10`, hdrs)
  const browseOk = browseRes.status === 200
  check(browseRes, { 'customer: browse restaurants 200': () => browseOk })
  errorRate.add(!browseOk)

  sleep(0.2)

  // Fetch restaurant menu
  const menuRes = http.get(`${BASE_URL}/restaurants/${restaurantId}/menu`, hdrs)
  const menuOk = menuRes.status === 200
  check(menuRes, { 'customer: get menu 200': () => menuOk })
  errorRate.add(!menuOk)

  sleep(0.2)

  // Place order
  const orderStart = Date.now()
  const orderRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({
      restaurantId,
      items: [{ menuItemId, quantity: 1 }],
      deliveryAddress: FIXTURES.deliveryAddress,
      deliveryLat: FIXTURES.deliveryLat,
      deliveryLng: FIXTURES.deliveryLng,
      paymentMethod: 'cod',
    }),
    authHeaders(customerToken),
  )
  orderPlaceDuration.add(Date.now() - orderStart)

  const orderOk = orderRes.status === 200 || orderRes.status === 201
  check(orderRes, { 'customer: place order 2xx': () => orderOk })
  errorRate.add(!orderOk)
  if (orderOk) orderCount.add(1)

  sleep(0.4)
}

// ---------------------------------------------------------------------------
// Restaurant flow: list orders → update first order status
// ---------------------------------------------------------------------------

export function restaurantFlow(data) {
  const { restaurantToken } = data
  const hdrs = authHeaders(restaurantToken)

  // Fetch pending orders
  const listRes = http.get(
    `${BASE_URL}/restaurants/orders?status=PENDING&page=1&limit=20`,
    hdrs,
  )
  const listOk = listRes.status === 200
  check(listRes, { 'restaurant: list orders 200': () => listOk })
  errorRate.add(!listOk)

  sleep(0.15)

  // Confirm first order in list (if any)
  if (listOk) {
    const body = listRes.json()
    const orders = Array.isArray(body) ? body : (body.data ?? body.orders ?? [])
    if (orders.length > 0) {
      const orderId = orders[0]?.id ?? orders[0]?.orderId
      if (orderId) {
        const updateStart = Date.now()
        const updateRes = http.patch(
          `${BASE_URL}/restaurants/orders/${orderId}/status`,
          JSON.stringify({ status: 'CONFIRMED' }),
          hdrs,
        )
        statusUpdateDuration.add(Date.now() - updateStart)

        const updateOk = updateRes.status < 300
        check(updateRes, { 'restaurant: update status 2xx': () => updateOk })
        errorRate.add(!updateOk)
      }
    }
  }

  sleep(0.35)
}

// ---------------------------------------------------------------------------
// Driver flow: location ping → check offers
// ---------------------------------------------------------------------------

export function driverFlow(data) {
  const { driverToken } = data
  const hdrs = authHeaders(driverToken)

  // Ping current location (jitter to simulate movement)
  const pingStart = Date.now()
  const pingRes = http.post(
    `${BASE_URL}/drivers/location`,
    JSON.stringify({
      lat: FIXTURES.deliveryLat + (Math.random() * 0.01 - 0.005),
      lng: FIXTURES.deliveryLng + (Math.random() * 0.01 - 0.005),
    }),
    hdrs,
  )
  locationPingDuration.add(Date.now() - pingStart)

  const pingOk = pingRes.status < 300
  check(pingRes, { 'driver: location ping 2xx': () => pingOk })
  errorRate.add(!pingOk)

  sleep(0.1)

  // Check available delivery offers
  const offersRes = http.get(`${BASE_URL}/drivers/offers`, hdrs)
  const offersOk = offersRes.status === 200
  check(offersRes, { 'driver: offers 200': () => offersOk })
  errorRate.add(!offersOk)

  sleep(0.4)
}
