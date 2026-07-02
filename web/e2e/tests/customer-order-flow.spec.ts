import { expect, test } from '@playwright/test'
import { API_URL, TEST_USERS } from '../fixtures/test-users'
import {
  getFirstMenuItemIdViaApi,
  getOrderStatusViaApi,
  getRestaurantIdViaApi,
  loginViaApi,
  placeOrderViaApi,
} from '../fixtures/api-helpers'
import { loginRestaurantApp } from '../fixtures/ui-auth'

let customerToken: string
let restaurantToken: string
let restaurantId: string
let menuItemId: string

test.describe('Customer order flow', () => {
  test.beforeAll(async ({ request }) => {
    const custAuth = await loginViaApi(
      request,
      TEST_USERS.customer.email,
      TEST_USERS.customer.password,
    )
    customerToken = custAuth.accessToken

    const restAuth = await loginViaApi(
      request,
      TEST_USERS.restaurant.email,
      TEST_USERS.restaurant.password,
    )
    restaurantToken = restAuth.accessToken
    restaurantId = await getRestaurantIdViaApi(request, restaurantToken)
    menuItemId = await getFirstMenuItemIdViaApi(request, restaurantId)
  })

  test('seed data has a restaurant and menu item', async ({ request }) => {
    expect(restaurantId).toBeTruthy()
    expect(menuItemId).toBeTruthy()

    const resp = await request.get(`${API_URL}/restaurants/${restaurantId}`)
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    const restaurant = body.data ?? body
    expect(restaurant).toHaveProperty('name')
  })

  test('placing a new order enters restaurant pending status', async ({ request }) => {
    const orderId = await placeOrderViaApi(request, customerToken, restaurantId, menuItemId)
    expect(orderId).toBeTruthy()

    const status = await getOrderStatusViaApi(request, customerToken, orderId)
    expect(status).toBe('restaurant_pending')
  })

  test('orders list contains at least one order', async ({ request }) => {
    await placeOrderViaApi(request, customerToken, restaurantId, menuItemId)

    const resp = await request.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    const orders: unknown[] = body.data?.orders ?? body.orders ?? body.data ?? body ?? []
    expect(orders.length).toBeGreaterThan(0)
  })

  test('cancelling an order moves it to cancelled', async ({ request }) => {
    const orderId = await placeOrderViaApi(request, customerToken, restaurantId, menuItemId)
    const cancelResp = await request.post(`${API_URL}/orders/${orderId}/cancel`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: { reason: 'E2E test cancellation' },
    })
    expect([200, 201, 204]).toContain(cancelResp.status())

    const status = await getOrderStatusViaApi(request, customerToken, orderId)
    expect(status).toBe('cancelled')
  })

  test('restaurant sees a new pending order on kanban', async ({ page, request }) => {
    const orderId = await placeOrderViaApi(request, customerToken, restaurantId, menuItemId)
    expect(orderId).toBeTruthy()

    await loginRestaurantApp(page, request)
    await expect(page.getByRole('heading', { name: /order queue/i })).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole('heading', { name: /new/i }).first(),
    ).toBeVisible({ timeout: 10_000 })
  })
})
