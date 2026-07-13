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

async function gotoAppRoute(page: Page, targetUrl: string): Promise<void> {
  const response = await page.goto(targetUrl)
  expect(response?.status(), `${targetUrl} should not return the Next.js 404 shell`).not.toBe(404)
  await expect(page.getByRole('heading', { name: /^404$/ })).toHaveCount(0)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

export function gotoAdminRoute(page: Page, path: string, locale?: 'vi' | 'en' | 'ja'): Promise<void> {
  return gotoAppRoute(page, adminUrl(path, locale))
}

export function gotoRestaurantRoute(page: Page, path: string, locale?: 'vi' | 'en' | 'ja'): Promise<void> {
  return gotoAppRoute(page, restaurantUrl(path, locale))
}

async function waitForNavigationDrawer(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect.poll(async () => {
    const box = await dialog.boundingBox()
    return box ? Math.round(box.x) : null
  }, { message: 'navigation drawer should finish opening' }).toBe(0)
}

export async function openAdminNavigation(page: Page): Promise<void> {
  if ((page.viewportSize()?.width ?? 1280) >= 1024) return

  const mobileMenu = page.getByRole('button', {
    name: /open admin menu|mở menu quản trị|管理メニューを開く/i,
  })

  await expect(mobileMenu).toBeVisible()
  await mobileMenu.click()
  await waitForNavigationDrawer(page)
}

export async function openRestaurantNavigation(page: Page): Promise<void> {
  if ((page.viewportSize()?.width ?? 1280) >= 1024) return

  const mobileMenu = page.getByRole('button', {
    name: /open restaurant menu|mở menu nhà hàng|レストランメニューを開く/i,
  })

  await expect(mobileMenu).toBeVisible()
  await mobileMenu.click()
  await waitForNavigationDrawer(page)
}

export async function loginAdminApp(
  page: Page,
  request: APIRequestContext,
  locale?: 'vi' | 'en' | 'ja',
): Promise<void> {
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

  await gotoAdminRoute(page, '/overview', locale)
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

  await gotoRestaurantRoute(page, '/orders')
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
