import { expect, test } from '@playwright/test';
import { gotoAdminRoute, loginAdminApp } from '../fixtures/ui-auth';

const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

test.describe('Keyless live map basemap', () => {
  test('loads the Admin driver map from OpenFreeMap without a browser API key', async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await loginAdminApp(page, request, 'en');
    const styleResponse = await request.get(OPENFREEMAP_STYLE_URL, { timeout: 20_000 });
    expect(styleResponse.status()).toBe(200);
    const style = (await styleResponse.json()) as { version?: number; sources?: unknown; layers?: unknown[] };
    expect(style.version).toBe(8);
    expect(style.sources).toBeTruthy();
    expect(Array.isArray(style.layers)).toBe(true);

    const supportsWebGl2 = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2'));
    });
    await gotoAdminRoute(page, '/drivers/map', 'en');

    await expect(page.getByTestId('admin-driver-map-canvas')).toBeVisible({ timeout: 20_000 });
    if (!supportsWebGl2) {
      await expect(page.getByRole('alert')).toContainText(/map is unavailable/i, {
        timeout: 20_000,
      });
      expect(consoleErrors, `Unexpected browser console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
      return;
    }

    await expect(page.getByRole('status', { name: /loading the live map/i })).toHaveCount(0, {
      timeout: 20_000,
    });
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/NEXT_PUBLIC_GOOGLE_MAPS_KEY/i)).toHaveCount(0);
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/OpenFreeMap|OpenStreetMap/i, {
      timeout: 20_000,
    });

    expect(consoleErrors, `Unexpected browser console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
  });
});
