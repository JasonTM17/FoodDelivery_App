import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { getRestaurantIdViaApi, loginViaApi } from './api-helpers'
import { adminUrl, restaurantUrl, TEST_USERS } from './test-users'

const loginButtonName = /sign in|log in|login|đăng nhập|ログイン/i

async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first().fill(email)
  await page
    .getByLabel(/password|mật khẩu|パスワード/i)
    .or(page.locator('input[type="password"]'))
    .first()
    .fill(password)
  await page.getByRole('button', { name: loginButtonName }).click()
}

async function seedLocalStorage(page: Page, values: Record<string, string>): Promise<void> {
  await page.addInitScript((entries: [string, string][]) => {
    for (const [key, value] of entries) localStorage.setItem(key, value)
  }, Object.entries(values))
}

export async function loginAdminApp(page: Page, request: APIRequestContext): Promise<void> {
  const auth = await loginViaApi(request, TEST_USERS.admin.email, TEST_USERS.admin.password)
  await seedLocalStorage(page, {
    admin_token: auth.accessToken,
    admin_refresh_token: auth.refreshToken,
    admin_user: JSON.stringify({
      name: 'FoodFlow Admin',
      email: TEST_USERS.admin.email,
      role: 'admin',
    }),
  })

  await page.goto(adminUrl('/overview'))
  await expect(page).toHaveURL(/\/overview/, { timeout: 15_000 })
}

export async function loginRestaurantApp(page: Page, request: APIRequestContext): Promise<void> {
  const auth = await loginViaApi(
    request,
    TEST_USERS.restaurant.email,
    TEST_USERS.restaurant.password,
  )
  const restaurantId = await getRestaurantIdViaApi(request, auth.accessToken)
  await seedLocalStorage(page, {
    restaurant_token: auth.accessToken,
    restaurant_refresh_token: auth.refreshToken,
    restaurant_data: JSON.stringify({ id: restaurantId, name: 'FoodFlow E2E Restaurant' }),
  })

  await page.goto(restaurantUrl('/orders'))
  await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 })
}

export function submitAdminLogin(page: Page, password = TEST_USERS.admin.password): Promise<void> {
  return fillLoginForm(page, TEST_USERS.admin.email, password)
}

export function submitRestaurantLogin(
  page: Page,
  email = TEST_USERS.restaurant.email,
  password = TEST_USERS.restaurant.password,
): Promise<void> {
  return fillLoginForm(page, email, password)
}
