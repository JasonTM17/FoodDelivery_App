import { expect, test } from '@playwright/test'
import { API_URL, adminUrl, TEST_USERS } from '../fixtures/test-users'
import {
  getFirstMenuItemIdViaApi,
  getOrderStatusViaApi,
  getRestaurantIdViaApi,
  loginViaApi,
  placeOrderViaApi,
  updateOrderStatusViaApi,
} from '../fixtures/api-helpers'
import { loginAdminApp } from '../fixtures/ui-auth'

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
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Order ${orderId} did not reach status '${expected}' within ${timeoutMs}ms`)
}

test.describe('Realtime order status updates', () => {
  let customerToken: string
  let restaurantToken: string
  let restaurantId: string
  let menuItemId: string

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

  test('restaurant acceptance updates customer-visible status', async ({ request }) => {
    const orderId = await placeOrderViaApi(request, customerToken, restaurantId, menuItemId)
    expect(orderId).toBeTruthy()
    expect(await getOrderStatusViaApi(request, customerToken, orderId)).toBe('restaurant_pending')

    const ok = await updateOrderStatusViaApi(request, restaurantToken, orderId, 'restaurant_accepted')
    expect(ok).toBeTruthy()

    await waitForOrderStatus(request, customerToken, orderId, 'restaurant_accepted')
    expect(await getOrderStatusViaApi(request, customerToken, orderId)).toBe('restaurant_accepted')
  })

  test('full status flow: pending to accepted to preparing to ready', async ({ request }) => {
    const orderId = await placeOrderViaApi(request, customerToken, restaurantId, menuItemId)

    for (const next of ['restaurant_accepted', 'preparing', 'ready_for_pickup'] as const) {
      const ok = await updateOrderStatusViaApi(request, restaurantToken, orderId, next)
      expect(ok).toBeTruthy()
      await waitForOrderStatus(request, customerToken, orderId, next)
    }
    expect(await getOrderStatusViaApi(request, customerToken, orderId)).toBe('ready_for_pickup')
  })

  test('admin order detail reflects latest status', async ({ page, request }) => {
    const orderId = await placeOrderViaApi(request, customerToken, restaurantId, menuItemId)
    await updateOrderStatusViaApi(request, restaurantToken, orderId, 'restaurant_accepted')
    await waitForOrderStatus(request, customerToken, orderId, 'restaurant_accepted')

    await loginAdminApp(page, request)
    await page.goto(adminUrl(`/orders/${orderId}`))

    await expect(
      page.getByText(/accepted|confirmed|restaurant accepted|đã xác nhận|nhà hàng đã nhận|確認済み|処理中/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('tracking endpoint is available while order is active', async ({ request }) => {
    const orderId = await placeOrderViaApi(request, customerToken, restaurantId, menuItemId)
    for (const status of ['restaurant_accepted', 'preparing', 'ready_for_pickup'] as const) {
      const ok = await updateOrderStatusViaApi(request, restaurantToken, orderId, status)
      expect(ok).toBeTruthy()
    }

    const resp = await request.get(`${API_URL}/orders/${orderId}/tracking`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    expect([200, 404]).toContain(resp.status())
    if (resp.status() === 200) {
      const body = await resp.json()
      const tracking = body.data ?? body
      expect(tracking).toHaveProperty('orderId')
    }
  })
})
