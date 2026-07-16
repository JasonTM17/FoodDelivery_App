/**
 * Capture professional product screenshots + short GIFs for docs.
 * Requires local stack: API :3001, Admin :3000, Restaurant :3002, seeded DB.
 *
 *   cd web && pnpm exec playwright install chromium
 *   node docs/scripts/capture-product-media.mjs
 *
 * Does not print secrets. Uses seed accounts only.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { buildManifestAssetIntegrity } from './product-media-integrity.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const SHOTS = path.join(ROOT, 'docs/screenshots')
const GIFS = path.join(ROOT, 'docs/media/gifs')

// Resolve Playwright from web workspace (@playwright/test re-exports chromium)
const requireFromWeb = createRequire(path.join(ROOT, 'web/package.json'))
let chromium
try {
  ;({ chromium } = requireFromWeb('playwright'))
} catch {
  ;({ chromium } = requireFromWeb('@playwright/test'))
}

const ADMIN_URL = process.env.FOODFLOW_ADMIN_URL || 'http://localhost:3000'
const REST_URL = process.env.FOODFLOW_RESTAURANT_URL || 'http://localhost:3002'
const API_URL = process.env.FOODFLOW_API_URL || 'http://localhost:3001/api'
const BROWSER_CHANNEL = process.env.FOODFLOW_BROWSER_CHANNEL || 'chrome'
const LOCALE = 'vi-VN'

const SEED = {
  admin: { email: 'admin@foodflow.vn', password: 'Admin@123' },
  restaurant: { email: 'restaurant1@foodflow.vn', password: 'Partner@123' },
}

async function ensureDirs() {
  await mkdir(path.join(SHOTS, 'admin'), { recursive: true })
  await mkdir(path.join(SHOTS, 'restaurant'), { recursive: true })
  await mkdir(GIFS, { recursive: true })
}

function gitText(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : 'unknown'
}

async function readExistingManifest() {
  try {
    return JSON.parse(await readFile(path.join(SHOTS, 'manifest.json'), 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return {}
    throw error
  }
}

async function waitForCaptureReady(page, label) {
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
  })
  await page.waitForTimeout(800)

  const bodyText = await page.locator('body').innerText()
  const errorMarkers = ['Application error', 'Failed to fetch', 'ERR_CONNECTION', 'Internal Server Error']
  const marker = errorMarkers.find((candidate) => bodyText.includes(candidate))
  if (marker) throw new Error(`${label} is not capture-ready: visible ${marker}`)
}

async function loginViaApi(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Login failed ${res.status}: ${t.slice(0, 200)}`)
  }
  const json = await res.json()
  const data = json.data || json
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  }
}

async function injectAuth(page, baseUrl, tokens, role) {
  await page.context().addInitScript(
    ({ tokens, role }) => {
      try {
        if (role === 'admin') {
          localStorage.setItem('admin_token', tokens.accessToken)
          if (tokens.refreshToken) localStorage.setItem('admin_refresh_token', tokens.refreshToken)
          if (tokens.user) localStorage.setItem('admin_user', JSON.stringify(tokens.user))
        } else {
          localStorage.setItem('restaurant_token', tokens.accessToken)
          if (tokens.refreshToken) localStorage.setItem('restaurant_refresh_token', tokens.refreshToken)
          if (tokens.user) localStorage.setItem('restaurant_data', JSON.stringify(tokens.user))
        }
      } catch {
        /* ignore */
      }
    },
    { tokens, role },
  )
}

async function shot(page, relPath, fullPage = false) {
  const file = path.join(SHOTS, relPath)
  await waitForCaptureReady(page, relPath)
  await page.screenshot({ path: file, fullPage, type: 'png' })
  console.log('shot', relPath)
}

async function captureAdmin(browser, tokens) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: LOCALE,
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  await injectAuth(page, ADMIN_URL, tokens, 'admin')

  // Login page (public) — use fresh context without auth for marketing shot
  const publicCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: LOCALE })
  const loginPage = await publicCtx.newPage()
  await loginPage.goto(`${ADMIN_URL}/vi/login`, { waitUntil: 'networkidle', timeout: 60_000 })
  await shot(loginPage, 'admin/01-login.png')
  await publicCtx.close()

  const routes = [
    ['admin/02-overview.png', '/vi/overview'],
    ['admin/03-orders.png', '/vi/orders'],
    ['admin/04-restaurants.png', '/vi/restaurants'],
    ['admin/05-users.png', '/vi/users'],
    ['admin/06-drivers.png', '/vi/drivers'],
    ['admin/07-promotions.png', '/vi/promotions'],
    ['admin/08-support.png', '/vi/support'],
    ['admin/09-analytics.png', '/vi/analytics'],
    ['admin/10-settings.png', '/vi/settings'],
  ]

  for (const [file, route] of routes) {
    await page.goto(`${ADMIN_URL}${route}`, { waitUntil: 'networkidle', timeout: 60_000 })
    // Prefer content-ready if present
    await page.waitForTimeout(1200)
    await shot(page, file)
  }

  // GIF: login form interaction on public page
  const gifCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: LOCALE })
  const g = await gifCtx.newPage()
  await g.goto(`${ADMIN_URL}/vi/login`, { waitUntil: 'networkidle', timeout: 60_000 })
  await g.screenshot({ path: path.join(GIFS, 'admin-login-frame-1.png') })
  const email = g.locator('input[type="email"], input[name="email"]').first()
  const pass = g.locator('input[type="password"]').first()
  if (await email.count()) {
    await email.fill(SEED.admin.email)
    await g.screenshot({ path: path.join(GIFS, 'admin-login-frame-2.png') })
    await pass.fill(SEED.admin.password)
    await g.screenshot({ path: path.join(GIFS, 'admin-login-frame-3.png') })
    const btn = g.locator('button[type="submit"]').first()
    if (await btn.count()) {
      await btn.click()
      await g.waitForTimeout(2500)
      await g.screenshot({ path: path.join(GIFS, 'admin-login-frame-4.png') })
    }
  }
  await gifCtx.close()
  await context.close()
}

async function captureRestaurant(browser, tokens) {
  const publicCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: LOCALE })
  const loginPage = await publicCtx.newPage()
  await loginPage.goto(`${REST_URL}/vi/login`, { waitUntil: 'networkidle', timeout: 60_000 })
  await shot(loginPage, 'restaurant/01-login.png')
  await publicCtx.close()

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: LOCALE })
  const page = await context.newPage()
  await injectAuth(page, REST_URL, tokens, 'restaurant')

  const routes = [
    ['restaurant/02-dashboard.png', '/vi'],
    ['restaurant/03-orders.png', '/vi/orders'],
    ['restaurant/04-menu.png', '/vi/menu'],
    ['restaurant/05-promotions.png', '/vi/promotions'],
    ['restaurant/06-revenue.png', '/vi/revenue'],
    ['restaurant/07-reviews.png', '/vi/reviews'],
    ['restaurant/08-staff.png', '/vi/staff'],
    ['restaurant/09-insights.png', '/vi/insights'],
    ['restaurant/10-settings.png', '/vi/settings'],
  ]

  for (const [file, route] of routes) {
    await page.goto(`${REST_URL}${route}`, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.waitForTimeout(1200)
    await shot(page, file)
  }

  // GIF frames: navigate orders after auth
  await page.goto(`${REST_URL}/vi/orders`, { waitUntil: 'networkidle', timeout: 60_000 })
  await page.screenshot({ path: path.join(GIFS, 'restaurant-orders-frame-1.png') })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(GIFS, 'restaurant-orders-frame-2.png') })
  await page.goto(`${REST_URL}/vi/menu`, { waitUntil: 'networkidle', timeout: 60_000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(GIFS, 'restaurant-orders-frame-3.png') })
  await context.close()
}

async function buildGifsWithFfmpeg() {
  const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
  if (hasFfmpeg.status !== 0) {
    console.warn('ffmpeg not found — leaving PNG frames; install ffmpeg for animated GIFs')
    return
  }

  const jobs = [
    {
      out: path.join(GIFS, 'admin-login-flow.gif'),
      pattern: path.join(GIFS, 'admin-login-frame-%d.png').replace(/%d/, '%d'),
      // ffmpeg needs sequential start; use concat demuxer
      frames: [
        'admin-login-frame-1.png',
        'admin-login-frame-2.png',
        'admin-login-frame-3.png',
        'admin-login-frame-4.png',
      ],
    },
    {
      out: path.join(GIFS, 'restaurant-orders-to-menu.gif'),
      frames: [
        'restaurant-orders-frame-1.png',
        'restaurant-orders-frame-2.png',
        'restaurant-orders-frame-3.png',
      ],
    },
  ]

  for (const job of jobs) {
    const listPath = path.join(GIFS, `${path.basename(job.out)}.txt`)
    const listBody = job.frames
      .map((f) => `file '${path.join(GIFS, f).replace(/\\/g, '/')}'\nduration 1.2`)
      .join('\n')
    // last frame needs a duration repeat for gif
    const last = job.frames[job.frames.length - 1]
    const body = `${listBody}\nfile '${path.join(GIFS, last).replace(/\\/g, '/')}'\n`
    await writeFile(listPath, body, 'utf8')
    try {
      const r = spawnSync(
        'ffmpeg',
        [
          '-y',
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          listPath,
          '-filter_complex',
          'fps=4,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
          job.out,
        ],
        { encoding: 'utf8' },
      )
      if (r.status === 0) console.log('gif', path.relative(ROOT, job.out))
      else console.warn('gif failed', job.out, r.stderr?.slice(0, 400))
    } finally {
      await Promise.all([
        rm(listPath, { force: true }),
        ...job.frames.map((frame) => rm(path.join(GIFS, frame), { force: true })),
      ])
    }
  }
}

async function main() {
  // Capture provenance before screenshots or GIFs mutate the worktree. This
  // distinguishes pre-existing source changes from the expected output files.
  const sourceHead = gitText(['rev-parse', 'HEAD'])
  const dirtyWorkspaceAtStart = gitText(['status', '--porcelain']).length > 0

  console.log('API', API_URL)
  console.log('Admin', ADMIN_URL)
  console.log('Restaurant', REST_URL)
  await ensureDirs()

  const adminTokens = await loginViaApi(SEED.admin.email, SEED.admin.password)
  const restTokens = await loginViaApi(SEED.restaurant.email, SEED.restaurant.password)
  console.log('auth ok')

  // Prefer playwright from web workspace
  let browser
  try {
    browser = await chromium.launch({ channel: BROWSER_CHANNEL, headless: true })
  } catch (e) {
    console.error(`Launch ${BROWSER_CHANNEL} failed. Install Google Chrome or set FOODFLOW_BROWSER_CHANNEL.`)
    throw e
  }

  const browserVersion = browser.version()

  try {
    await captureAdmin(browser, adminTokens)
    await captureRestaurant(browser, restTokens)
  } finally {
    await browser.close()
  }

  await buildGifsWithFfmpeg()

  // Merge web evidence into the existing manifest so mobile provenance is
  // never discarded by a web-only recapture.
  const capturedAt = new Date().toISOString()
  const existingManifest = await readExistingManifest()
  const manifest = {
    ...existingManifest,
    capturedAt,
    adminUrl: ADMIN_URL,
    restaurantUrl: REST_URL,
    seed: {
      admin: SEED.admin.email,
      restaurant: SEED.restaurant.email,
    },
    webCapture: {
      capturedAt,
      sourceHead,
      dirtyWorkspace: dirtyWorkspaceAtStart,
      environment: 'Isolated foodflow-batch4-e2e Docker stack with deterministic seed data',
      composeFiles: ['docker-compose.yml', 'docker-compose.e2e.yml'],
      runtimeImages: {
        backend: 'foodflow-batch4-e2e-backend:latest (revision=local)',
        admin: 'foodflow-batch4-e2e-admin:latest (revision=local)',
        restaurant: 'foodflow-batch4-e2e-restaurant:latest (revision=local)',
      },
      browser: `Google Chrome ${browserVersion}`,
      browserChannel: BROWSER_CHANNEL,
      locale: LOCALE,
      viewport: '1440x900 stills; 1280x800 GIF source frames',
      privacyReview:
        'Deterministic local seed data only; no production credentials, tokens, provider keys, or personal browser content are visible',
      files: {
        admin: [
          'admin/01-login.png',
          'admin/02-overview.png',
          'admin/03-orders.png',
          'admin/04-restaurants.png',
          'admin/05-users.png',
          'admin/06-drivers.png',
          'admin/07-promotions.png',
          'admin/08-support.png',
          'admin/09-analytics.png',
          'admin/10-settings.png',
        ],
        restaurant: [
          'restaurant/01-login.png',
          'restaurant/02-dashboard.png',
          'restaurant/03-orders.png',
          'restaurant/04-menu.png',
          'restaurant/05-promotions.png',
          'restaurant/06-revenue.png',
          'restaurant/07-reviews.png',
          'restaurant/08-staff.png',
          'restaurant/09-insights.png',
          'restaurant/10-settings.png',
        ],
        gifs: ['../media/gifs/admin-login-flow.gif', '../media/gifs/restaurant-orders-to-menu.gif'],
      },
    },
  }
  manifest.assetIntegrity = await buildManifestAssetIntegrity(manifest, {
    baseDirectory: SHOTS,
  })
  await writeFile(path.join(SHOTS, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
