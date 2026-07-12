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
    const styleResponse = page.waitForResponse(
      (response) => response.url().startsWith(OPENFREEMAP_STYLE_URL) && response.status() === 200,
      { timeout: 20_000 },
    );
    await gotoAdminRoute(page, '/drivers/map', 'en');

    await expect(page.getByTestId('admin-driver-map-canvas')).toBeVisible();
    await styleResponse;
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
