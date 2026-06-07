import { test, expect } from '@playwright/test'
import {
  ADMIN_URL,
  RESTAURANT_URL,
  API_URL,
  TEST_USERS,
  uniqueEmail,
} from '../fixtures/test-users'
import { loginViaApi } from '../fixtures/api-helpers'

test.describe('Admin — đăng nhập / đăng xuất', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`)
  })

  test('đăng nhập thành công → chuyển hướng đến Tổng quan', async ({ page }) => {
    await page.getByLabel('Email').fill(TEST_USERS.admin.email)
    await page.getByLabel('Mật khẩu').fill(TEST_USERS.admin.password)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/overview/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /tổng quan/i })).toBeVisible()
  })

  test('sai mật khẩu → hiển thị thông báo lỗi', async ({ page }) => {
    await page.getByLabel('Email').fill(TEST_USERS.admin.email)
    await page.getByLabel('Mật khẩu').fill('SaiMatKhau@999')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    // Error div rendered with destructive/10 background (see login/page.tsx)
    await expect(page.locator('.bg-destructive\\/10, [class*="bg-destructive"]')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('đăng xuất → quay về trang đăng nhập', async ({ page }) => {
    await page.getByLabel('Email').fill(TEST_USERS.admin.email)
    await page.getByLabel('Mật khẩu').fill(TEST_USERS.admin.password)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/overview/, { timeout: 15_000 })

    // Logout button is in the sidebar user menu
    const logoutTrigger = page
      .getByRole('button', { name: /đăng xuất/i })
      .or(page.getByText(/đăng xuất/i).first())
    await logoutTrigger.click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Restaurant — đăng nhập / đăng xuất', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${RESTAURANT_URL}/login`)
  })

  test('đăng nhập thành công → chuyển hướng đến Đơn hàng', async ({ page }) => {
    await page.getByLabel('Email').fill(TEST_USERS.restaurant.email)
    await page.getByLabel('Mật khẩu').fill(TEST_USERS.restaurant.password)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 })
    await expect(page.getByText(/đơn hàng/i).first()).toBeVisible()
  })

  test('email không tồn tại → hiển thị thông báo lỗi', async ({ page }) => {
    await page.getByLabel('Email').fill('khong.ton.tai@foodflow.vn')
    await page.getByLabel('Mật khẩu').fill('AnyPass@123')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page.getByText(/đăng nhập thất bại|không tồn tại|invalid/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('đăng xuất → quay về trang đăng nhập', async ({ page }) => {
    await page.getByLabel('Email').fill(TEST_USERS.restaurant.email)
    await page.getByLabel('Mật khẩu').fill(TEST_USERS.restaurant.password)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 })
    await page
      .getByRole('button', { name: /đăng xuất/i })
      .or(page.getByText(/đăng xuất/i).first())
      .click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Customer — đăng ký / đăng nhập qua API', () => {
  test('đăng ký email mới → nhận access token + role customer', async ({ request }) => {
    const email = uniqueEmail()
    const resp = await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password: 'TestE2E@123',
        fullName: 'Khách Hàng E2E',
        phone: '0909998887',
      },
    })
    expect(resp.status()).toBe(201)
    const body = await resp.json()
    expect(body).toHaveProperty('accessToken')
    expect(body.user.email).toBe(email)
    expect(body.user.role).toBe('customer')
  })

  test('đăng ký email đã tồn tại → 409 Conflict', async ({ request }) => {
    const resp = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: TEST_USERS.customer.email,
        password: 'TestE2E@123',
        fullName: 'Trùng Email',
        phone: '0909998886',
      },
    })
    expect(resp.status()).toBe(409)
  })

  test('đăng nhập customer → token hợp lệ với đúng role', async ({ request }) => {
    const { accessToken, role } = await loginViaApi(
      request,
      TEST_USERS.customer.email,
      TEST_USERS.customer.password,
    )
    expect(accessToken).toBeTruthy()
    expect(role).toBe('customer')
  })

  test('refresh token → trả về access token mới', async ({ request }) => {
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
    expect(body).toHaveProperty('accessToken')
  })
})
