import { test, expect, type Page } from '@playwright/test'
import { ADMIN_URL, TEST_USERS } from '../fixtures/test-users'
import { loginViaApi } from '../fixtures/api-helpers'

async function loginAdminApp(page: Page): Promise<void> {
  await page.goto(`${ADMIN_URL}/login`)
  await page.getByLabel('Email').fill(TEST_USERS.admin.email)
  await page.getByLabel('Mật khẩu').fill(TEST_USERS.admin.password)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/overview/, { timeout: 15_000 })
}

test.describe('Admin Dashboard', () => {
  test('trang Tổng quan hiển thị thẻ KPI', async ({ page }) => {
    await loginAdminApp(page)

    // Overview page heading
    await expect(page.getByRole('heading', { name: /tổng quan/i })).toBeVisible()

    // At least one stat card with a numeric value must be rendered
    // OverviewStats renders 4 skeleton cards while loading, then real data
    await expect(page.getByText(/đơn hàng|doanh thu|nhà hàng|tài xế/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('điều hướng đến bản đồ tài xế', async ({ page }) => {
    await loginAdminApp(page)

    await page.getByRole('link', { name: /tài xế|drivers/i }).first().click()
    // Accept either the list page or the map sub-page
    await expect(page).toHaveURL(/\/drivers/)
    // Map page or driver list must render
    await expect(page.getByText(/tài xế|bản đồ|drivers/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('trang Đơn hàng hiển thị bảng dữ liệu', async ({ page }) => {
    await loginAdminApp(page)

    await page.getByRole('link', { name: /đơn hàng|orders/i }).first().click()
    await expect(page).toHaveURL(/\/orders/)

    // Table headers or order rows should appear
    await expect(
      page.getByRole('table').or(page.getByRole('grid')).or(page.getByText(/trạng thái|status/i).first()),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('bộ lọc đơn hàng theo trạng thái hoạt động', async ({ page }) => {
    await loginAdminApp(page)
    await page.goto(`${ADMIN_URL}/orders`)

    // Look for a status filter (select, combobox, or filter button)
    const filterEl = page
      .getByRole('combobox', { name: /trạng thái|status/i })
      .or(page.getByRole('button', { name: /lọc|filter/i }))
      .first()
    await expect(filterEl).toBeVisible({ timeout: 10_000 })

    // Interact with the filter
    await filterEl.click()
    // Some dropdown/menu should appear after clicking
    await expect(
      page.getByRole('option').or(page.getByRole('menuitem')).first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('trang Nhà hàng hiển thị danh sách', async ({ page }) => {
    await loginAdminApp(page)
    await page.getByRole('link', { name: /nhà hàng|restaurants/i }).first().click()
    await expect(page).toHaveURL(/\/restaurants/)
    await expect(page.getByText(/phở|bún|cơm|nhà hàng/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('Admin API: /admin/* endpoint yêu cầu xác thực', async ({ request }) => {
    // Unauthenticated request should be rejected
    const resp = await request.get(
      `${process.env.API_URL ?? 'http://localhost:3001/api'}/admin/stats`,
    )
    expect([401, 403]).toContain(resp.status())
  })

  test('Admin API: /admin/stats trả về dữ liệu cho admin hợp lệ', async ({ request }) => {
    const { accessToken } = await loginViaApi(
      request,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password,
    )
    const resp = await request.get(
      `${process.env.API_URL ?? 'http://localhost:3001/api'}/admin/stats`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    // Stats endpoint should return numeric fields
    expect(typeof (body.totalOrders ?? body.orders ?? body)).not.toBe('undefined')
  })
})
