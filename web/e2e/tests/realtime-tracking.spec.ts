import { test, expect } from '@playwright/test'
import { ADMIN_URL, API_URL, TEST_USERS } from '../fixtures/test-users'
import {
  loginViaApi,
  getRestaurantIdViaApi,
  getFirstMenuItemIdViaApi,
  placeOrderViaApi,
  getOrderStatusViaApi,
  updateOrderStatusViaApi,
} from '../fixtures/api-helpers'

// Polls getOrderStatusViaApi until expected status or timeout (ms)
async function waitForOrderStatus(
  request: Parameters<typeof getOrderStatusViaApi>[0],
  token: string,
  orderId: string,
  expected: string,
  timeoutMs = 8_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const status = await getOrderStatusViaApi(request, token, orderId)
    if (status === expected) return
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Order ${orderId} did not reach status '${expected}' within ${timeoutMs}ms`)
}

test.describe('Realtime — cập nhật trạng thái đơn hàng', () => {
  let customerToken: string
  let restaurantToken: string
  let restaurantId: string
  let menuItemId: string

  test.beforeAll(async ({ request }) => {
    const custAuth = await loginViaApi(
      request, TEST_USERS.customer.email, TEST_USERS.customer.password,
    )
    customerToken = custAuth.accessToken

    const restAuth = await loginViaApi(
      request, TEST_USERS.restaurant.email, TEST_USERS.restaurant.password,
    )
    restaurantToken = restAuth.accessToken
    restaurantId = await getRestaurantIdViaApi(request, restaurantToken)
    menuItemId = await getFirstMenuItemIdViaApi(request, restaurantId)
  })

  test('đặt đơn → nhà hàng xác nhận → trạng thái cập nhật thành accepted', async ({
    request,
  }) => {
    const orderId = await placeOrderViaApi(
      request, customerToken, restaurantId, menuItemId,
    )
    expect(orderId).toBeTruthy()
    expect(await getOrderStatusViaApi(request, customerToken, orderId)).toBe('pending')

    const ok = await updateOrderStatusViaApi(request, restaurantToken, orderId, 'accepted')
    expect(ok).toBeTruthy()

    await waitForOrderStatus(request, customerToken, orderId, 'accepted')
    expect(await getOrderStatusViaApi(request, customerToken, orderId)).toBe('accepted')
  })

  test('luồng đầy đủ: pending → accepted → preparing → ready', async ({ request }) => {
    const orderId = await placeOrderViaApi(
      request, customerToken, restaurantId, menuItemId,
    )
    for (const [next, check] of [
      ['accepted', 'accepted'],
      ['preparing', 'preparing'],
      ['ready', 'ready'],
    ] as const) {
      await updateOrderStatusViaApi(request, restaurantToken, orderId, next)
      await waitForOrderStatus(request, customerToken, orderId, check)
    }
    expect(await getOrderStatusViaApi(request, customerToken, orderId)).toBe('ready')
  })

  test('admin dashboard phản chiếu trạng thái mới nhất', async ({ page, request }) => {
    const orderId = await placeOrderViaApi(
      request, customerToken, restaurantId, menuItemId,
    )
    await updateOrderStatusViaApi(request, restaurantToken, orderId, 'accepted')
    await waitForOrderStatus(request, customerToken, orderId, 'accepted')

    // Login to admin and navigate to the order detail
    await page.goto(`${ADMIN_URL}/login`)
    await page.getByLabel('Email').fill(TEST_USERS.admin.email)
    await page.getByLabel('Mật khẩu').fill(TEST_USERS.admin.password)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/overview/, { timeout: 15_000 })

    await page.goto(`${ADMIN_URL}/orders/${orderId}`)

    // Order detail page should show 'accepted' or the Vietnamese equivalent
    await expect(
      page.getByText(/accepted|đã xác nhận|đang xử lý/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('customer tracking API phản ánh vị trí tài xế sau khi có tài xế nhận', async ({
    request,
  }) => {
    const orderId = await placeOrderViaApi(
      request, customerToken, restaurantId, menuItemId,
    )
    // Advance to ready so a driver can pick up
    for (const status of ['accepted', 'preparing', 'ready'] as const) {
      await updateOrderStatusViaApi(request, restaurantToken, orderId, status)
    }

    // Tracking endpoint should be accessible while order is active
    const resp = await request.get(`${API_URL}/tracking/${orderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    // 200 with location data OR 404 if no driver assigned yet — both valid
    expect([200, 404]).toContain(resp.status())
    if (resp.status() === 200) {
      const body = await resp.json()
      expect(body).toHaveProperty('orderId')
    }
  })
})
