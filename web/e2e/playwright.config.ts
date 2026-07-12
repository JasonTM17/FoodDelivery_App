import { defineConfig, devices } from '@playwright/test'

const isCi = process.env.CI === 'true' || process.env.CI === '1'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: isCi ? 2 : 0,
  workers: 1,
  fullyParallel: false,
  forbidOnly: isCi,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    isCi ? ['github'] : ['list'],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // Deterministic WebGL for trusted E2E content on GPU-less local/CI runners.
          args: [
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
