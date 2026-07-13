import { expect, test } from '@playwright/test'
import { API_URL, TEST_USERS, uniqueEmail } from '../fixtures/test-users'
import { loginViaApi } from '../fixtures/api-helpers'
import {
  gotoAdminRoute,
  gotoRestaurantRoute,
  openAdminNavigation,
  submitAdminLogin,
  submitRestaurantLogin,
} from '../fixtures/ui-auth'

test.describe('Admin auth', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminRoute(page, '/login')
  })

  test('successful login redirects to overview and logout returns to login', async ({ page }) => {
    await submitAdminLogin(page)
    await expect(page).toHaveURL(/\/overview/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /overview|tổng quan|概要/i })).toBeVisible()

    await openAdminNavigation(page)
    const signOutName = /sign out|logout|đăng xuất|ログアウト/i
    const signOut = (page.viewportSize()?.width ?? 1280) < 1024
      ? page.getByRole('dialog').getByRole('button', { name: signOutName })
      : page.getByRole('button', { name: signOutName })

    await expect(signOut).toBeVisible()
    await signOut.click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Restaurant auth', () => {
  test.beforeEach(async ({ page }) => {
    await gotoRestaurantRoute(page, '/login')
  })

  test('unknown email shows an error', async ({ page }) => {
    await submitRestaurantLogin(page, 'khong.ton.tai@foodflow.vn', 'AnyPass@123')
    const loginError = /sign in failed|login failed|invalid|đăng nhập thất bại|không tồn tại/i
    await expect(page.getByRole('alert').filter({ hasText: loginError })).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('successful login opens the order queue and survives a page reload', async ({ page }) => {
    await submitRestaurantLogin(page)
    await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 })
    await expect(
      page.getByRole('heading', { name: /order queue|quản lý đơn hàng|注文/i }),
    ).toBeVisible()

    await page.reload()
    await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 })
    await expect(
      page.getByRole('heading', { name: /order queue|quản lý đơn hàng|注文/i }),
    ).toBeVisible()
  })
})

test.describe('Customer auth API', () => {
  test('registering a new email returns an access token and customer role', async ({ request }) => {
    const email = uniqueEmail()
    const resp = await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password: 'TestE2E@123',
        fullName: 'Khach Hang E2E',
      },
    })
    expect(resp.status()).toBe(201)
    const body = await resp.json()
    const payload = body.data ?? body
    expect(payload).toHaveProperty('accessToken')
    expect(payload.user.email).toBe(email)
    expect(payload.user.role).toBe('customer')
  })

  test('registering an existing email returns conflict', async ({ request }) => {
    const resp = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: TEST_USERS.customer.email,
        password: 'TestE2E@123',
        fullName: 'Trung Email',
      },
    })
    expect(resp.status()).toBe(409)
  })

  test('customer login returns a valid customer token', async ({ request }) => {
    const { accessToken, role } = await loginViaApi(
      request,
      TEST_USERS.customer.email,
      TEST_USERS.customer.password,
    )
    expect(accessToken).toBeTruthy()
    expect(role).toBe('customer')
  })

  test('refresh token returns a new access token', async ({ request }) => {
    const { refreshToken } = await loginViaApi(
      request,
      TEST_USERS.customer.email,
      TEST_USERS.customer.password,
    )
    const resp = await request.post(`${API_URL}/auth/refresh`, {
      data: { refreshToken },
    })
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    const payload = body.data ?? body
    expect(payload).toHaveProperty('accessToken')
  })
})
