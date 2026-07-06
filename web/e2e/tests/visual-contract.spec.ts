import { expect, test, type Locator, type Page } from '@playwright/test'
import { gotoAdminRoute, gotoRestaurantRoute } from '../fixtures/ui-auth'

const ADMIN_LOGIN_HEADING = /login|admin|quản trị|管理者/i
const RESTAURANT_LOGIN_HEADING = /login|restaurant|quản lý nhà hàng|nhà hàng|レストラン/i

async function disableMotion(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
}

async function expectFoodFlowLogo(logo: Locator): Promise<void> {
  await expect(logo).toBeVisible()

  const logoBox = await logo.boundingBox()
  expect(logoBox?.width ?? 0).toBeGreaterThanOrEqual(64)
  expect(logoBox?.height ?? 0).toBeGreaterThanOrEqual(64)

  const svg = logo.locator('svg')
  await expect(svg).toHaveAttribute('viewBox', '0 0 64 64')

  const stopColors = await svg.locator('stop').evaluateAll((stops) =>
    stops
      .map((stop) => stop.getAttribute('stop-color'))
      .filter(Boolean),
  )
  expect(stopColors).toEqual(expect.arrayContaining(['#EA580C', '#F97316', '#15803D', '#22C55E']))
}

async function expectCenteredLoginForm(page: Page, submitButton: Locator): Promise<void> {
  const form = page.locator('form')
  await expect(form).toBeVisible()
  const emailInput = form.locator('#email')
  const passwordInput = form.locator('#password')
  await expect(emailInput).toBeVisible()
  await expect(passwordInput).toBeVisible()
  await expect(submitButton).toBeVisible()

  const [formBox, viewport] = await Promise.all([form.boundingBox(), Promise.resolve(page.viewportSize())])
  expect(formBox).toBeTruthy()
  expect(viewport).toBeTruthy()
  if (!formBox || !viewport) return

  expect(formBox.width).toBeGreaterThanOrEqual(Math.min(280, viewport.width - 32))
  expect(formBox.width).toBeLessThanOrEqual(Math.min(448, viewport.width))

  const formCenter = formBox.x + formBox.width / 2
  expect(Math.abs(formCenter - viewport.width / 2)).toBeLessThanOrEqual(24)

  const buttonStyles = await submitButton.evaluate((button) => {
    const styles = window.getComputedStyle(button)
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      borderRadius: styles.borderRadius,
    }
  })

  expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(buttonStyles.color).not.toBe(buttonStyles.backgroundColor)
  expect(Number.parseFloat(buttonStyles.borderRadius)).toBeGreaterThanOrEqual(8)

  const controlRadii = await Promise.all([
    emailInput.evaluate((input) => window.getComputedStyle(input).borderRadius),
    passwordInput.evaluate((input) => window.getComputedStyle(input).borderRadius),
  ])
  for (const radius of controlRadii) {
    expect(Number.parseFloat(radius)).toBeGreaterThanOrEqual(8)
  }
}

test.describe('Batch 4 visual contract regression', () => {
  test('admin login keeps FoodFlow brand shell responsive @visual', async ({ page }, testInfo) => {
    await gotoAdminRoute(page, '/login', 'en')
    await disableMotion(page)

    await expect(page.getByRole('heading', { name: ADMIN_LOGIN_HEADING }).first()).toBeVisible()
    await expectFoodFlowLogo(page.getByRole('img', { name: 'FoodFlow' }).first())
    await expectCenteredLoginForm(page, page.locator('form button[type="submit"]'))

    await page.screenshot({
      path: testInfo.outputPath('admin-login-brand-shell.png'),
      fullPage: true,
    })
  })

  test('restaurant login keeps FoodFlow brand shell responsive @visual', async ({ page }, testInfo) => {
    await gotoRestaurantRoute(page, '/login', 'en')
    await disableMotion(page)

    await expect(page.getByRole('heading', { name: RESTAURANT_LOGIN_HEADING }).first()).toBeVisible()
    await expectFoodFlowLogo(page.getByRole('img', { name: 'FoodFlow' }).first())
    await expectCenteredLoginForm(page, page.locator('form button[type="submit"]'))

    await page.screenshot({
      path: testInfo.outputPath('restaurant-login-brand-shell.png'),
      fullPage: true,
    })
  })
})
