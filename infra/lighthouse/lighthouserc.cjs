/**
 * lighthouserc.cjs — Lighthouse CI configuration for FoodFlow web apps.
 *
 * Thresholds:
 *   Performance  ≥ 80 (mobile, default) / ≥ 90 (desktop — set LHCI_FORM_FACTOR=desktop)
 *   Accessibility ≥ 90
 *   LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms (proxy for INP)
 *   Initial JS bundle ≤ 200 KB gzipped per route
 *
 * Run:
 *   pnpm lhci autorun --config=infra/lighthouse/lighthouserc.cjs
 *
 * Desktop run:
 *   LHCI_FORM_FACTOR=desktop pnpm lhci autorun --config=infra/lighthouse/lighthouserc.cjs
 */

'use strict'

const isDesktop = process.env.LHCI_FORM_FACTOR === 'desktop'

const desktopEmulation = {
  mobile: false,
  width: 1350,
  height: 940,
  deviceScaleFactor: 1,
  disabled: false,
}

/** Minimum performance score: 0.80 mobile, 0.90 desktop */
const minPerfScore = isDesktop ? 0.9 : 0.8

/** Pages to audit — admin + restaurant web apps */
const urls = [
  process.env.ADMIN_URL || 'http://localhost:3000',
  `${process.env.ADMIN_URL || 'http://localhost:3000'}/orders`,
  process.env.RESTAURANT_URL || 'http://localhost:3002',
  `${process.env.RESTAURANT_URL || 'http://localhost:3002'}/orders`,
]

module.exports = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 2,
      settings: {
        formFactor: isDesktop ? 'desktop' : 'mobile',
        ...(isDesktop ? { screenEmulation: desktopEmulation } : {}),
        throttlingMethod: 'simulate',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu',
      },
    },

    assert: {
      assertions: {
        // ── Core category scores ──────────────────────────────────────────
        'categories:performance': ['error', { minScore: minPerfScore }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],

        // ── Core Web Vitals ───────────────────────────────────────────────
        // LCP ≤ 2500 ms
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        // TBT ≤ 200 ms (lab-measurable proxy for INP)
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        // CLS ≤ 0.1
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // ── Bundle size budget: initial JS ≤ 200 KB gzipped ──────────────
        // Lighthouse reports transfer size in bytes
        'resource-summary:script:transferSize': [
          'error',
          { maxNumericValue: 204_800 }, // 200 * 1024 bytes
        ],

        // ── Accessibility detail gates ────────────────────────────────────
        'color-contrast': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        'link-name': ['warn', { minScore: 1 }],
        'button-name': ['error', { minScore: 1 }],
      },
    },

    upload: {
      // Upload to LHCI server if configured, otherwise use temporary storage
      target: process.env.LHCI_SERVER_URL ? 'lhci' : 'temporary-public-storage',
      ...(process.env.LHCI_SERVER_URL
        ? {
            serverBaseUrl: process.env.LHCI_SERVER_URL,
            token: process.env.LHCI_TOKEN,
          }
        : {}),
    },
  },
}
