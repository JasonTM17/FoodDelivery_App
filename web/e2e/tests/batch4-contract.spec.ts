import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ADMIN_URL, API_URL, TEST_USERS } from '../fixtures/test-users';
import { loginViaApi } from '../fixtures/api-helpers';

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

test.describe('Batch 4 API contracts', () => {
  test('AI chatbot returns a protected, non-empty service reply', async ({ request }) => {
    const { accessToken } = await loginViaApi(
      request,
      TEST_USERS.customer.email,
      TEST_USERS.customer.password,
    );

    const response = await request.post(`${API_URL}/ai/chat`, {
      headers: authHeaders(accessToken),
      data: { message: 'hello', sessionId: `e2e-ai-${Date.now()}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({ success: true });
    const reply = unwrap<{ reply: string; sessionId: string; action: string }>(body);
    expect(reply.reply.trim().length).toBeGreaterThan(0);
    expect(['answered', 'escalated', 'degraded']).toContain(reply.action);
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

    await page.goto(`${ADMIN_URL}/vi/export-jobs`);
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await expect(
      page.getByRole('table').or(page.getByRole('combobox')).or(page.getByRole('button')).first(),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(seriousOrCritical).toEqual([]);
  });
});
