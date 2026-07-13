import { expect, test } from '@playwright/test'
import {
  collectRuntimeErrors,
  expectNoRuntimeErrors,
  expectNoSeriousOrCriticalAxeViolations,
  focusFirstVisibleAppControl,
} from '../fixtures/accessibility'
import {
  gotoAdminRoute,
  gotoRestaurantRoute,
  loginAdminApp,
  loginRestaurantApp,
} from '../fixtures/ui-auth'

const adminCriticalRoutes = [
  '/overview',
  '/orders',
  '/restaurants',
  '/users',
  '/drivers',
  '/drivers/map',
  '/promotions',
  '/logs',
  '/export-jobs',
  '/support',
  '/analytics',
  '/ai-monitor',
] as const

const restaurantCriticalRoutes = [
  '/orders',
  '/menu',
  '/promotions',
  '/revenue',
  '/reviews',
  '/staff',
  '/analytics',
  '/insights',
  '/settings/profile',
  '/settings/hours',
] as const

async function expectCriticalPageReady(page: Parameters<typeof collectRuntimeErrors>[0]) {
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 })
  await focusFirstVisibleAppControl(page)
}

test.describe('Critical-page accessibility and runtime integrity', () => {
  for (const route of adminCriticalRoutes) {
    test(`Admin ${route} has no serious/critical axe or runtime errors`, async ({ page, request }) => {
      const errors = collectRuntimeErrors(page)
      await loginAdminApp(page, request, 'en')
      if (route !== '/overview') await gotoAdminRoute(page, route, 'en')

      await expectCriticalPageReady(page)
      await expectNoSeriousOrCriticalAxeViolations(page, `Admin ${route}`)
      expectNoRuntimeErrors(errors, `Admin ${route}`)
    })
  }

  for (const route of restaurantCriticalRoutes) {
    test(`Restaurant ${route} has no serious/critical axe or runtime errors`, async ({ page, request }) => {
      const errors = collectRuntimeErrors(page)
      await loginRestaurantApp(page, request)
      if (route !== '/orders') await gotoRestaurantRoute(page, route, 'en')

      await expectCriticalPageReady(page)
      await expectNoSeriousOrCriticalAxeViolations(page, `Restaurant ${route}`)
      expectNoRuntimeErrors(errors, `Restaurant ${route}`)
    })
  }

  test('Restaurant shell keeps skip navigation, collapse offset, and mobile navigation accessible', async ({ page, request }) => {
    const errors = collectRuntimeErrors(page)
    await loginRestaurantApp(page, request)
    await gotoRestaurantRoute(page, '/orders', 'en')

    await page.setViewportSize({ width: 1280, height: 900 })
    const main = page.locator('main#main-content')
    const contentShell = main.locator('..')
    await expect(main).toHaveAttribute('tabindex', '-1')

    await page.getByRole('button', { name: 'Collapse sidebar' }).click()
    await expect(contentShell).toHaveCSS('margin-left', '64px')

    await page.setViewportSize({ width: 390, height: 844 })
    const skipLink = page.getByRole('link', { name: 'Skip to main content' })
    await skipLink.focus()
    await expect(skipLink).toBeVisible()
    await expect(skipLink).toHaveAttribute('href', '#main-content')

    await page.getByRole('button', { name: 'Open restaurant menu' }).click()
    const navigationDialog = page.getByRole('dialog', { name: 'FoodFlow restaurant menu' })
    await expect(navigationDialog).toHaveAccessibleDescription(
      'Choose an area to manage your restaurant',
    )
    await expect(navigationDialog.getByRole('link', { name: 'Orders' })).toBeFocused()

    await navigationDialog.getByRole('link', { name: 'Orders' }).click()
    await expect(navigationDialog).toHaveCount(0)

    await expectNoSeriousOrCriticalAxeViolations(page, 'Restaurant responsive shell')
    expectNoRuntimeErrors(errors, 'Restaurant responsive shell')
  })
})
