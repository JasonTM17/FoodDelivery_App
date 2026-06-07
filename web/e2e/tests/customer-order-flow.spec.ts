import { test, expect } from '@playwright/test'
import { RESTAURANT_URL, API_URL, TEST_USERS } from '../fixtures/test-users'
import {
  loginViaApi,
  getRestaurantIdViaApi,
  getFirstMenuItemIdViaApi,
  placeOrderViaApi,
  getOrderStatusViaApi,
} from '../fixtures/api-helpers'

// Shared context across tests in this describe block
let customerToken: string
let restaurantToken: string
let restaurantId: string
let menuItemId: string

test.describe('Customer — quy trình đặt hàng', () => {
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

  test('seed data hợp lệ: nhà hàng và thực đơn tồn tại', async ({ request }) => {
    expect(restaurantId).toBeTruthy()
    expect(menuItemId).toBeTruthy()

    const resp = await request.get(`${API_URL}/restaurants/${restaurantId}`)
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    expect(body).toHaveProperty('name')
  })

  test('đặt đơn hàng mới → trạng thái ban đầu là pending', async ({ request }) => {
    const orderId = await placeOrderViaApi(
      request, customerToken, restaurantId, menuItemId,
    )
    expect(orderId).toBeTruthy()

    const status = await getOrderStatusViaApi(request, customerToken, orderId)
    expect(status).toBe('pending')
  })

  test('xem danh sách đơn hàng → ít nhất một đơn tồn tại', async ({ request }) => {
    // Ensure there is at least one order before querying
    await placeOrderViaApi(request, customerToken, restaurantId, menuItemId)

    const resp = await request.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    const orders: unknown[] = body.orders ?? body.data ?? body ?? []
    expect(orders.length).toBeGreaterThan(0)
  })

  test('hủy đơn hàng → trạng thái chuyển thành cancelled', async ({ request }) => {
    const orderId = await placeOrderViaApi(
      request, customerToken, restaurantId, menuItemId,
    )
    const cancelResp = await request.post(`${API_URL}/orders/${orderId}/cancel`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: { reason: 'E2E test cancellation' },
    })
    // 200 OK or 204 No Content are both valid
    expect([200, 204]).toContain(cancelResp.status())

    const status = await getOrderStatusViaApi(request, customerToken, orderId)
    expect(status).toMatch(/cancelled|canceled/)
  })

  test('nhà hàng thấy đơn hàng mới trên kanban', async ({ page, request }) => {
    const orderId = await placeOrderViaApi(
      request, customerToken, restaurantId, menuItemId,
    )
    expect(orderId).toBeTruthy()

    await page.goto(`${RESTAURANT_URL}/login`)
    await page.getByLabel('Email').fill(TEST_USERS.restaurant.email)
    await page.getByLabel('Mật khẩu').fill(TEST_USERS.restaurant.password)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 })

    // The kanban board must render at least one pending-status column/card
    await expect(
      page.getByText(/đơn hàng mới|chờ xác nhận|pending/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })
})
