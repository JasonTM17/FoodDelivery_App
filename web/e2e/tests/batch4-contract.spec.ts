import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { API_URL, adminUrl, restaurantUrl, TEST_USERS } from '../fixtures/test-users';
import { loginViaApi } from '../fixtures/api-helpers';
import { gotoAdminRoute, loginAdminApp, loginRestaurantApp } from '../fixtures/ui-auth';

interface Envelope<T> {
  success?: boolean;
  data?: T;
  meta?: unknown;
}

interface ExportJob {
  id: string;
  resource: string;
  format: 'csv' | 'xlsx' | 'parquet';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  downloadUrl?: string;
  errorMessage?: string;
}

function unwrap<T>(body: unknown): T {
  const envelope = body as Envelope<T>;
  return envelope?.success === true && 'data' in envelope ? envelope.data as T : body as T;
}

function authHeaders(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

async function focusFirstVisibleAppControl(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.keyboard.press('Tab');
    const hasVisibleAppFocus = await page.evaluate(() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return false;
      if (active.closest('nextjs-portal')) return false;
      if (active.matches('[data-nextjs-dev-tools-button="true"]')) return false;
      if (!active.matches('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')) {
        return false;
      }

      const rect = active.getBoundingClientRect();
      const style = window.getComputedStyle(active);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    });
    if (hasVisibleAppFocus) return;
  }

  throw new Error('Expected keyboard Tab to focus a visible in-app control');
}

async function expectNoSeriousOrCriticalAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const seriousOrCritical = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const summary = seriousOrCritical.flatMap((violation) =>
    violation.nodes.map((node) => ({
      id: violation.id,
      impact: violation.impact,
      target: node.target,
      message: node.any[0]?.message ?? node.all[0]?.message ?? node.none[0]?.message,
    })),
  );
  expect(summary).toEqual([]);
}

const restaurantLoginLocales = [
  {
    locale: 'vi',
    heading: 'Quản lý nhà hàng',
    password: 'Mật khẩu',
    submit: 'Đăng nhập',
    showPassword: 'Hiện mật khẩu',
    title: 'Đăng nhập | FoodFlow Nhà hàng',
    conflictingCookie: 'en',
  },
  {
    locale: 'en',
    heading: 'Restaurant Manager',
    password: 'Password',
    submit: 'Sign In',
    showPassword: 'Show password',
    title: 'Sign In | FoodFlow Restaurant',
    conflictingCookie: 'vi',
  },
  {
    locale: 'ja',
    heading: 'レストラン管理',
    password: 'パスワード',
    submit: 'ログイン',
    showPassword: 'パスワードを表示',
    title: 'ログイン | FoodFlow レストラン',
    conflictingCookie: 'vi',
  },
] as const;

const adminOverviewLocales = [
  {
    locale: 'vi',
    title: 'Tổng quan | FoodFlow Admin',
    heading: 'Tổng quan',
    revenue: 'Doanh thu',
    conflictingCookie: 'en',
  },
  {
    locale: 'en',
    title: 'Overview | FoodFlow Admin',
    heading: 'Overview',
    revenue: 'Revenue',
    conflictingCookie: 'vi',
  },
  {
    locale: 'ja',
    title: '概要 | FoodFlow Admin',
    heading: '概要',
    revenue: '売上',
    conflictingCookie: 'vi',
  },
] as const;

async function expectRestaurantLoginLocale(
  page: Page,
  expected: (typeof restaurantLoginLocales)[number],
): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('lang', expected.locale);
  await expect(page).toHaveTitle(expected.title);
  await expect(page.getByRole('heading', { name: expected.heading, exact: true })).toBeVisible();
  await expect(page.getByLabel(expected.password, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: expected.showPassword, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: expected.submit, exact: true })).toBeVisible();
}

async function expectAdminOverviewLocale(
  page: Page,
  expected: (typeof adminOverviewLocales)[number],
): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('lang', expected.locale);
  await expect(page).toHaveTitle(expected.title);
  await expect(page.getByRole('heading', { name: expected.heading, exact: true })).toBeVisible();
  await expect(
    page.getByTestId('kpi-card-revenue').getByRole('heading', { name: expected.revenue, exact: true }),
  ).toBeVisible();
}

test.describe('Batch 4 public locale contracts', () => {
  for (const expected of restaurantLoginLocales) {
    test(`restaurant login honors /${expected.locale} in a fresh browser context`, async ({ page }) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];

      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      const loginUrl = restaurantUrl('/login', expected.locale);
      const response = await page.goto(loginUrl);
      expect(response?.status(), 'Restaurant login must not resolve to a 404 shell').toBeLessThan(400);
      await expectRestaurantLoginLocale(page, expected);

      await page.context().addCookies([{
        name: 'NEXT_LOCALE',
        value: expected.conflictingCookie,
        url: new URL(loginUrl).origin,
      }]);
      const conflictingCookieResponse = await page.reload();
      expect(conflictingCookieResponse?.status(), 'A stale locale cookie must not break the URL locale')
        .toBeLessThan(400);
      await expectRestaurantLoginLocale(page, expected);

      await focusFirstVisibleAppControl(page);
      await expectNoSeriousOrCriticalAxeViolations(page);
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }

  for (const expected of adminOverviewLocales) {
    test(
      'admin overview honors /' + expected.locale + ' with a stale locale cookie',
      async ({ page, request }) => {
        const pageErrors: string[] = [];
        const consoleErrors: string[] = [];

        page.on('pageerror', (error) => pageErrors.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });

        await loginAdminApp(page, request, expected.locale);
        await expectAdminOverviewLocale(page, expected);

        const overviewUrl = adminUrl('/overview', expected.locale);
        await page.context().addCookies([{
          name: 'NEXT_LOCALE',
          value: expected.conflictingCookie,
          url: new URL(overviewUrl).origin,
        }]);
        const conflictingCookieResponse = await page.reload();
        expect(conflictingCookieResponse?.status(), 'A stale locale cookie must not break the URL locale')
          .toBeLessThan(400);
        await expectAdminOverviewLocale(page, expected);

        await focusFirstVisibleAppControl(page);
        await expectNoSeriousOrCriticalAxeViolations(page);
        expect(pageErrors).toEqual([]);
        expect(consoleErrors).toEqual([]);
      },
    );
  }
});

test.describe('Batch 4 API contracts', () => {
  test('AI chatbot is protected and follows the configured-provider contract', async ({ request }) => {
    const { accessToken } = await loginViaApi(
      request,
      TEST_USERS.customer.email,
      TEST_USERS.customer.password,
    );

    const response = await request.post(`${API_URL}/ai/chat`, {
      headers: authHeaders(accessToken),
      data: { message: 'hello' },
    });

    const body = await response.json();
    if (process.env.E2E_AI_LIVE !== 'true') {
      expect(response.status()).toBe(503);
      expect(body).toMatchObject({
        status: 503,
        code: 'AI_PROVIDER_NOT_CONFIGURED',
      });
      return;
    }

    expect(response.ok()).toBeTruthy();
    expect(body).toMatchObject({ success: true });
    const reply = unwrap<{ reply: string; sessionId: string; action: string }>(body);
    expect(reply.reply.trim().length).toBeGreaterThan(0);
    expect(['answered', 'escalated']).toContain(reply.action);
  });

  test('admin settings and export jobs use canonical web envelopes', async ({ request }) => {
    const { accessToken } = await loginViaApi(
      request,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password,
    );

    const settingsResponse = await request.get(`${API_URL}/admin/settings/integrations`, {
      headers: authHeaders(accessToken),
    });
    expect(settingsResponse.ok()).toBeTruthy();
    const settingsBody = await settingsResponse.json();
    expect(settingsBody).toMatchObject({ success: true });
    expect(unwrap<{ section: string; settings: Record<string, unknown> }>(settingsBody))
      .toMatchObject({ section: 'integrations' });

    const exportResponse = await request.post(`${API_URL}/admin/exports`, {
      headers: authHeaders(accessToken),
      data: {
        resource: 'audit_logs',
        format: 'csv',
        dateFrom: '2026-07-01',
        dateTo: '2026-07-02',
      },
    });
    expect(exportResponse.ok()).toBeTruthy();
    const exportBody = await exportResponse.json();
    expect(exportBody).toMatchObject({ success: true });
    const job = unwrap<ExportJob>(exportBody);
    expect(job).toMatchObject({
      resource: 'audit_logs',
      format: 'csv',
      status: 'completed',
      progress: 100,
    });
    expect(job.downloadUrl).toMatch(/^\/admin\/exports\/.+\/download$/);
  });

  test('admin drivers returns database profiles with canonical pagination', async ({ request }) => {
    const { accessToken } = await loginViaApi(
      request,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password,
    );

    const response = await request.get(`${API_URL}/admin/drivers?page=1&limit=20`, {
      headers: authHeaders(accessToken),
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json() as Envelope<Array<{
      id: string;
      email: string;
      status: string;
      totalDeliveries: number;
    }>>;
    expect(body).toMatchObject({ success: true });
    expect(body.meta).toMatchObject({ page: 1, limit: 20 });
    for (const driver of body.data ?? []) {
      expect(driver.id).toBeTruthy();
      expect(driver.email).toContain('@');
      expect(['online', 'offline', 'delivering']).toContain(driver.status);
      expect(driver.totalDeliveries).toBeGreaterThanOrEqual(0);
    }
  });

  test('restaurant menu categories are updated with PATCH, not legacy PUT', async ({ request }) => {
    const { accessToken } = await loginViaApi(
      request,
      TEST_USERS.restaurant.email,
      TEST_USERS.restaurant.password,
    );

    const listResponse = await request.get(`${API_URL}/restaurant/menu/categories`, {
      headers: authHeaders(accessToken),
    });
    expect(listResponse.ok()).toBeTruthy();
    const categoriesBody = await listResponse.json();
    const categories = unwrap<Array<{ id: string; name: string; isVisible?: boolean }>>(categoriesBody);
    test.skip(categories.length === 0, 'Seed has no restaurant categories to update');

    const first = categories[0];
    const patchResponse = await request.patch(`${API_URL}/restaurant/menu/categories/${first.id}`, {
      headers: authHeaders(accessToken),
      data: { name: first.name },
    });
    expect(patchResponse.ok()).toBeTruthy();
    const updated = unwrap<{ id: string; name: string }>(await patchResponse.json());
    expect(updated).toMatchObject({ id: first.id, name: first.name });
  });
});

test.describe('Batch 4 accessibility smoke', () => {
  test('admin export jobs page exposes keyboard focus and has no serious axe violations', async ({
    page,
    request,
  }) => {
    const { accessToken, refreshToken, role } = await loginViaApi(
      request,
      TEST_USERS.admin.email,
      TEST_USERS.admin.password,
    );

    await page.addInitScript(
      ({ token, refresh, adminUser }) => {
        localStorage.setItem('admin_token', token);
        if (refresh) localStorage.setItem('admin_refresh_token', refresh);
        localStorage.setItem('admin_user', JSON.stringify(adminUser ?? { role: 'admin' }));
      },
      {
        token: accessToken,
        refresh: refreshToken,
        adminUser: { email: TEST_USERS.admin.email, role },
      },
    );

    await gotoAdminRoute(page, '/export-jobs');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

    await focusFirstVisibleAppControl(page);
    await expect(
      page.getByRole('table').or(page.getByRole('combobox')).or(page.getByRole('button')).first(),
    ).toBeVisible();

    await expectNoSeriousOrCriticalAxeViolations(page);
  });

  test('restaurant order queue exposes keyboard focus and has no serious axe violations', async ({
    page,
    request,
  }) => {
    await loginRestaurantApp(page, request);
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

    await focusFirstVisibleAppControl(page);
    await expect(
      page.getByRole('button').or(page.getByRole('link')).or(page.getByRole('combobox')).first(),
    ).toBeVisible();

    await expectNoSeriousOrCriticalAxeViolations(page);
  });
});
