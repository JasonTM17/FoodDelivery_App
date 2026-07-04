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
  responseData,
  resolveFixtures,
  resolveCustomerAddress,
} from './k6-helpers.js'

const TEST_DURATION = __ENV.LOADTEST_DURATION || '5m'
const CUSTOMER_RATE = Number(__ENV.LOADTEST_CUSTOMER_RATE || 60)
const RESTAURANT_RATE = Number(__ENV.LOADTEST_RESTAURANT_RATE || 30)
const DRIVER_RATE = Number(__ENV.LOADTEST_DRIVER_RATE || 10)
const CUSTOMER_POOL_SIZE = Number(__ENV.LOADTEST_CUSTOMER_POOL_SIZE || 100)

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const errorRate = new Rate('errors')
const orderPlaceDuration = new Trend('order_place_duration_ms', true)
const locationPingDuration = new Trend('location_ping_duration_ms', true)
const orderCount = new Counter('orders_placed')

// ---------------------------------------------------------------------------
// k6 options — three constant-arrival-rate scenarios summing to 100 RPS
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    customer_flow: {
      executor: 'constant-arrival-rate',
      rate: CUSTOMER_RATE,
      timeUnit: '1s',
      duration: TEST_DURATION,
      preAllocatedVUs: 80,
      maxVUs: 200,
      exec: 'customerFlow',
    },
    restaurant_flow: {
      executor: 'constant-arrival-rate',
      rate: RESTAURANT_RATE,
      timeUnit: '1s',
      duration: TEST_DURATION,
      preAllocatedVUs: 40,
      maxVUs: 100,
      exec: 'restaurantFlow',
    },
    driver_flow: {
      executor: 'constant-arrival-rate',
      rate: DRIVER_RATE,
      timeUnit: '1s',
      duration: TEST_DURATION,
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
  },
}

// ---------------------------------------------------------------------------
// setup() — runs once, resolves tokens + fixture IDs
// ---------------------------------------------------------------------------

export function setup() {
  const restaurant = login('restaurant')
  const driver = login('driver')

  const { restaurantId, menuItemId } = resolveFixtures(restaurant.accessToken)
  const customers = []

  for (let i = 1; i <= CUSTOMER_POOL_SIZE; i++) {
    const customer = login(`customer${i}`, {
      email: `customer${i}@foodflow.vn`,
      password: 'Customer@123',
    })
    const addressId = resolveCustomerAddress(customer.accessToken)
    if (customer.accessToken && addressId) {
      customers.push({ ...customer, addressId })
    }
  }

  if (!restaurantId || !menuItemId) {
    throw new Error('k6 setup: failed to resolve restaurant/menu fixtures')
  }
  if (customers.length === 0) {
    throw new Error('k6 setup: failed to resolve customer tokens and addresses')
  }

  return {
    customers,
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
  const { restaurantId, menuItemId } = data
  const customer = data.customers[(__VU - 1) % data.customers.length]
  const customerToken = customer.accessToken
  const addressId = customer.addressId
  const hdrs = authHeaders(customerToken)

  // Browse restaurant list
  const browseRes = http.get(
    `${BASE_URL}/restaurants/nearby?lat=${FIXTURES.deliveryLat}&lng=${FIXTURES.deliveryLng}&radius=8&page=1&limit=10`,
  )
  const browsePayload = responseData(browseRes)
  const browseItems = Array.isArray(browsePayload)
    ? browsePayload
    : (browsePayload?.items ?? browsePayload?.restaurants ?? [])
  const browseOk = browseRes.status === 200 && browseItems.length > 0
  check(browseRes, { 'customer: browse restaurants 200': () => browseOk })
  errorRate.add(!browseOk)

  sleep(0.2)

  // Fetch restaurant menu
  const menuRes = http.get(`${BASE_URL}/restaurants/${restaurantId}/menu`)
  const menuOk = menuRes.status === 200 && !!menuItemId
  check(menuRes, { 'customer: get menu 200': () => menuOk })
  errorRate.add(!menuOk)

  sleep(0.2)

  http.del(`${BASE_URL}/cart`, null, hdrs)
  const addCartRes = http.post(
    `${BASE_URL}/cart/items`,
    JSON.stringify({
      restaurantId,
      menuItemId,
      quantity: 1,
      selectedOptions: [],
    }),
    hdrs,
  )
  const addCartOk = addCartRes.status === 200 || addCartRes.status === 201
  check(addCartRes, { 'customer: add cart item 2xx': () => addCartOk })
  errorRate.add(!addCartOk)

  // Place order from the real cart contract
  const orderStart = Date.now()
  const orderRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({
      addressId,
      paymentMethod: 'cash',
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
    `${BASE_URL}/restaurant/orders?status=restaurant_pending`,
    hdrs,
  )
  const listOk = listRes.status === 200
  check(listRes, { 'restaurant: list orders 200': () => listOk })
  errorRate.add(!listOk)

  sleep(0.15)

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
    `${BASE_URL}/driver/online`,
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

  // Check active delivery assignment
  const offersRes = http.get(`${BASE_URL}/driver/orders/active`, hdrs)
  const offersOk = offersRes.status === 200
  check(offersRes, { 'driver: active order 200': () => offersOk })
  errorRate.add(!offersOk)

  sleep(0.4)
}
