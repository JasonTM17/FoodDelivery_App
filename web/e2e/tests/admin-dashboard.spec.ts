import { expect, test } from '@playwright/test'
import { loginViaApi } from '../fixtures/api-helpers'
import { loginAdminApp } from '../fixtures/ui-auth'
import { API_URL, ADMIN_URL, TEST_USERS } from '../fixtures/test-users'

test.describe('Admin Dashboard', () => {
  test('overview renders KPI cards', async ({ page, request }) => {
    await loginAdminApp(page, request)

    await expect(page.getByRole('heading', { name: /overview|tổng quan|概要/i })).toBeVisible()
    await expect(
      page
        .getByText(/orders|revenue|restaurants|drivers|đơn hàng|doanh thu|nhà hàng|tài xế/i)
        .first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('navigates to driver map/list', async ({ page, request }) => {
    await loginAdminApp(page, request)

    await page.getByRole('link', { name: /drivers|tài xế/i }).first().click()
    await expect(page).toHaveURL(/\/drivers/)
    await expect(page.getByText(/drivers|map|tài xế|bản đồ/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('orders page renders data table or status content', async ({ page, request }) => {
    await loginAdminApp(page, request)

    await page.getByRole('link', { name: /orders|đơn hàng/i }).first().click()
    await expect(page).toHaveURL(/\/orders/)
    await expect(page.getByRole('table').or(page.getByRole('status'))).toBeVisible({ timeout: 10_000 })
  })

  test('orders status filter is interactive', async ({ page, request }) => {
    await loginAdminApp(page, request)
    await page.goto(`${ADMIN_URL}/orders`)

    const filterEl = page.getByRole('combobox', {
      name: /filter by status|lọc theo trạng thái|ステータスで絞り込む/i,
    })
    await expect(filterEl).toBeVisible({ timeout: 10_000 })
    await filterEl.click()
    const pendingOption = page.getByRole('option', {
      name: /awaiting restaurant|chờ nhà hàng xác nhận|レストラン確認待ち/i,
    })
    await expect(pendingOption).toBeVisible({ timeout: 5_000 })
    await pendingOption.click()
    await expect(filterEl).toContainText(
      /awaiting restaurant|chờ nhà hàng xác nhận|レストラン確認待ち/i,
    )
  })

  test('restaurants page renders a list', async ({ page, request }) => {
    await loginAdminApp(page, request)
    await page.getByRole('link', { name: /restaurants|nhà hàng/i }).first().click()
    await expect(page).toHaveURL(/\/restaurants/)
    await expect(page.getByText(/phở|bún|cơm|restaurant|nhà hàng/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('Admin API: /admin/* endpoint requires auth', async ({ request }) => {
    const resp = await request.get(`${API_URL}/admin/dashboard`)
    expect([401, 403]).toContain(resp.status())
  })

  test('Admin API: /admin/dashboard returns data for valid admin', async ({ request }) => {
    const { accessToken } = await loginViaApi(
      request,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password,
    )
    const resp = await request.get(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    const payload = body.data ?? body
    expect(typeof (payload.totalOrders ?? payload.orders ?? payload)).not.toBe('undefined')
  })
})
