import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export interface RuntimeErrors {
  consoleErrors: string[]
  pageErrors: string[]
}

export function collectRuntimeErrors(page: Page): RuntimeErrors {
  const errors: RuntimeErrors = { consoleErrors: [], pageErrors: [] }
  page.on('pageerror', (error) => errors.pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.consoleErrors.push(message.text())
  })
  return errors
}

export async function focusFirstVisibleAppControl(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.keyboard.press('Tab')
    const hasVisibleAppFocus = await page.evaluate(() => {
      const active = document.activeElement
      if (!(active instanceof HTMLElement)) return false
      if (active.closest('nextjs-portal')) return false
      if (active.matches('[data-nextjs-dev-tools-button="true"]')) return false
      if (!active.matches('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')) {
        return false
      }

      const rect = active.getBoundingClientRect()
      const style = window.getComputedStyle(active)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    })
    if (hasVisibleAppFocus) return
  }

  throw new Error('Expected keyboard Tab to focus a visible in-app control')
}

export async function expectNoSeriousOrCriticalAxeViolations(
  page: Page,
  routeLabel = page.url(),
): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze()
  const summary = results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .flatMap((violation) =>
      violation.nodes.map((node) => ({
        id: violation.id,
        impact: violation.impact,
        route: routeLabel,
        target: node.target,
        message: node.any[0]?.message ?? node.all[0]?.message ?? node.none[0]?.message,
      })),
    )

  expect(summary).toEqual([])
}

export function expectNoRuntimeErrors(errors: RuntimeErrors, routeLabel: string): void {
  expect(errors.pageErrors, `${routeLabel} emitted page errors`).toEqual([])
  expect(errors.consoleErrors, `${routeLabel} emitted console errors`).toEqual([])
}
