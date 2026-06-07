import { test, expect, type Page } from '@playwright/test'
import { RESTAURANT_URL, API_URL, TEST_USERS } from '../fixtures/test-users'
import {
  loginViaApi,
  getRestaurantIdViaApi,
  getFirstMenuItemIdViaApi,
  placeOrderViaApi,
  updateOrderStatusViaApi,
} from '../fixtures/api-helpers'

async function loginRestaurantApp(page: Page): Promise<void> {
  await page.goto(`${RESTAURANT_URL}/login`)
  await page.getByLabel('Email').fill(TEST_USERS.restaurant.email)
  await page.getByLabel('Mật khẩu').fill(TEST_USERS.restaurant.password)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 })
}

// Creates a fresh pending order before each test that needs one
async function createPendingOrder(
  request: Parameters<typeof loginViaApi>[0],
): Promise<{ orderId: string; restToken: string }> {
  const restAuth = await loginViaApi(
    request, TEST_USERS.restaurant.email, TEST_USERS.restaurant.password,
  )
  const restaurantId = await getRestaurantIdViaApi(request, restAuth.accessToken)
  const menuItemId = await getFirstMenuItemIdViaApi(request, restaurantId)

  const custAuth = await loginViaApi(
    request, TEST_USERS.customer.email, TEST_USERS.customer.password,
  )
  const orderId = await placeOrderViaApi(
    request, custAuth.accessToken, restaurantId, menuItemId,
  )
  return { orderId, restToken: restAuth.accessToken }
}

test.describe('Restaurant — quản lý đơn hàng', () => {
  test('đăng nhập → kanban board hiển thị cột trạng thái', async ({ page }) => {
    await loginRestaurantApp(page)
    // Board must show at least one status column heading
    await expect(
      page.getByText(/đơn hàng mới|chờ xác nhận|đang chuẩn bị|sẵn sàng/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('xác nhận đơn hàng mới → đơn chuyển sang trạng thái tiếp theo', async ({
    page,
    request,
  }) => {
    const { orderId } = await createPendingOrder(request)
    expect(orderId).toBeTruthy()

    await loginRestaurantApp(page)

    // Accept button on the pending order card
    const acceptBtn = page
      .getByRole('button', { name: /xác nhận|chấp nhận|nhận đơn|accept/i })
      .first()
    await expect(acceptBtn).toBeVisible({ timeout: 10_000 })
    await acceptBtn.click()

    // After accepting, some visual indicator of progress should appear
    await expect(
      page.getByText(/đang chuẩn bị|đã xác nhận|preparing|accepted/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('đánh dấu đơn hàng sẵn sàng → nút sẵn sàng khả dụng', async ({
    page,
    request,
  }) => {
    const { orderId, restToken } = await createPendingOrder(request)
    // Advance order to 'accepted' via API so the restaurant sees it in the preparing stage
    await updateOrderStatusViaApi(request, restToken, orderId, 'accepted')

    await loginRestaurantApp(page)

    // The "mark ready" / "chuẩn bị xong" button should now be visible
    const readyBtn = page
      .getByRole('button', { name: /chuẩn bị xong|sẵn sàng|ready/i })
      .first()
    await expect(readyBtn).toBeVisible({ timeout: 10_000 })
    await readyBtn.click()

    await expect(
      page.getByText(/sẵn sàng giao|đã sẵn sàng|ready/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('điều hướng đến trang Thực đơn', async ({ page }) => {
    await loginRestaurantApp(page)
    await page.getByRole('link', { name: /thực đơn|menu/i }).click()
    await expect(page).toHaveURL(/\/menu/)
    await expect(
      page.getByRole('heading', { name: /thực đơn|menu/i }),
    ).toBeVisible()
  })

  test('API nhà hàng từ chối cập nhật trạng thái sai thứ tự', async ({ request }) => {
    const { orderId, restToken } = await createPendingOrder(request)
    // Attempting to jump directly from 'pending' to 'delivered' should fail
    const resp = await request.patch(
      `${API_URL}/restaurants/orders/${orderId}/status`,
      {
        headers: { Authorization: `Bearer ${restToken}` },
        data: { status: 'delivered' },
      },
    )
    expect(resp.ok()).toBeFalsy()
  })
})
