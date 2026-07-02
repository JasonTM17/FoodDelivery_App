import { expect, test } from '@playwright/test'
import { API_URL, TEST_USERS } from '../fixtures/test-users'
import {
  getFirstMenuItemIdViaApi,
  getRestaurantIdViaApi,
  loginViaApi,
  placeOrderViaApi,
  updateOrderStatusViaApi,
} from '../fixtures/api-helpers'
import { loginRestaurantApp } from '../fixtures/ui-auth'

async function createPendingOrder(
  request: Parameters<typeof loginViaApi>[0],
): Promise<{ orderId: string; restToken: string }> {
  const restAuth = await loginViaApi(
    request,
    TEST_USERS.restaurant.email,
    TEST_USERS.restaurant.password,
  )
  const restaurantId = await getRestaurantIdViaApi(request, restAuth.accessToken)
  const menuItemId = await getFirstMenuItemIdViaApi(request, restaurantId)
  const custAuth = await loginViaApi(
    request,
    TEST_USERS.customer.email,
    TEST_USERS.customer.password,
  )
  const orderId = await placeOrderViaApi(
    request,
    custAuth.accessToken,
    restaurantId,
    menuItemId,
  )

  return { orderId, restToken: restAuth.accessToken }
}

test.describe('Restaurant order management', () => {
  test('login renders kanban status columns', async ({ page, request }) => {
    await loginRestaurantApp(page, request)
    await expect(page.getByRole('heading', { name: /order queue/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /^new$/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^preparing$/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^ready$/i })).toBeVisible()
  })

  test('accepting a pending order moves it forward', async ({ page, request }) => {
    const { orderId } = await createPendingOrder(request)
    expect(orderId).toBeTruthy()

    await loginRestaurantApp(page, request)
    const acceptBtn = page
      .getByRole('button', { name: /accept|confirm|xác nhận|chấp nhận|nhận đơn/i })
      .first()
    await expect(acceptBtn).toBeVisible({ timeout: 10_000 })
    await acceptBtn.click()

    await expect(
      page.getByText(/preparing|accepted|đang chuẩn bị|đã xác nhận/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('mark ready button is available for preparing orders', async ({ page, request }) => {
    const { orderId, restToken } = await createPendingOrder(request)
    await updateOrderStatusViaApi(request, restToken, orderId, 'restaurant_accepted')
    await updateOrderStatusViaApi(request, restToken, orderId, 'preparing')

    await loginRestaurantApp(page, request)
    const readyBtn = page
      .getByRole('button', { name: /complete|ready|ready for pickup|mark ready|chuẩn bị xong|sẵn sàng/i })
      .first()
    await expect(readyBtn).toBeVisible({ timeout: 10_000 })
    await readyBtn.click()

    await expect(
      page.getByText(/ready|sẵn sàng giao|đã sẵn sàng/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('navigates to menu page', async ({ page, request }) => {
    await loginRestaurantApp(page, request)
    await page.getByRole('link', { name: /menu|thực đơn/i }).click()
    await expect(page).toHaveURL(/\/menu/)
    await expect(page.getByRole('heading', { name: /menu|thực đơn/i })).toBeVisible()
  })

  test('restaurant API rejects invalid status transition', async ({ request }) => {
    const { orderId, restToken } = await createPendingOrder(request)
    const resp = await request.patch(`${API_URL}/restaurant/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${restToken}` },
      data: { status: 'delivered' },
    })
    expect(resp.ok()).toBeFalsy()
  })
})
