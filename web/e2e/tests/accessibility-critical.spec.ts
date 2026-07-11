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
})
