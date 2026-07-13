# FoodFlow E2E Tests

Playwright test suite covering Admin, Restaurant, customer ordering, realtime tracking, tenant isolation, API contracts, mobile navigation, visual structure, and accessibility on critical runtime pages.

## Prerequisites

- Node 18+ and pnpm 11+
- Docker Compose (for backend stack)
- `@playwright/test` installed (see below)
- Seed data applied (`pnpm db:big-seed` from `backend/`)

## Quick Start

Use `docker-compose.e2e.yml` for release testing. It keeps its container names,
volumes, and host ports separate from the root/default stack: Admin `13000`,
API `13001`, Restaurant `13002`, and Postgres `15432`.

```bash
# 1. Start the database and supporting services
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d postgres redis minio

# 2. Apply migrations and seed the database
docker compose -f docker-compose.yml -f docker-compose.e2e.yml run --rm migrate
cd backend
pnpm install --frozen-lockfile
DATABASE_URL=postgresql://foodflow:foodflow_dev@localhost:15432/foodflow \
DIRECT_URL=postgresql://foodflow:foodflow_dev@localhost:15432/foodflow \
pnpm db:big-seed
cd ..

# 3. Build and start the API, background worker, and both dashboards
docker compose -f docker-compose.yml -f docker-compose.e2e.yml build backend admin restaurant
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d backend worker admin restaurant
docker compose -f docker-compose.yml -f docker-compose.e2e.yml logs --tail 100 worker

# 4. Install Playwright browser (once)
cd web && pnpm test:e2e:install

# 5. Run all E2E tests (Chromium, Firefox, and mobile Chromium)
cd web && ADMIN_URL=http://localhost:13000 RESTAURANT_URL=http://localhost:13002 API_URL=http://localhost:13001/api pnpm test:e2e

# Inspect the exact generated matrix without running it
cd web && pnpm test:e2e:list

# Desktop release gate only
ADMIN_URL=http://localhost:13000 RESTAURANT_URL=http://localhost:13002 API_URL=http://localhost:13001/api pnpm test:e2e --project=chromium --project=firefox

# Accessibility gate (fails on axe serious/critical violations)
ADMIN_URL=http://localhost:13000 RESTAURANT_URL=http://localhost:13002 API_URL=http://localhost:13001/api pnpm test:e2e --grep "accessibility" --project=chromium --project=firefox
```

In PowerShell, set `$env:ADMIN_URL`, `$env:RESTAURANT_URL`, and `$env:API_URL`
to the same isolated URLs before invoking `pnpm test:e2e`.

The GitHub E2E workflow builds this same overlay, seeds its disposable database through
`15432`, restarts the worker after seeding, requires a successful RAG synchronization,
and runs all three Playwright projects. Do not replace it with root Compose plus
`next dev`: that would exercise different origins, images, and browser coverage.

The worker deliberately has no HTTP port or HTTP health endpoint. Before treating a run as current-source evidence, require its logs to contain `FoodFlow Worker started` and a successful `RAG sync complete` entry.

This flow builds checked-out source as local `revision=local` images. It does not prove an immutable registry image, digest, or production deployment; a release still requires a frozen `sha-<full-commit>` build, scan, push, and clean pull.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ADMIN_URL` | `http://localhost:3000` | Admin Next.js app |
| `RESTAURANT_URL` | `http://localhost:3002` | Restaurant Next.js app |
| `API_URL` | `http://localhost:3001/api` | Backend API base URL |
| `E2E_AI_LIVE` | unset | Set to `true` only when the target API has a valid provider secret; otherwise the suite verifies the fail-closed `AI_PROVIDER_NOT_CONFIGURED` contract |

Override via shell: `ADMIN_URL=http://staging.example.com pnpm test:e2e`

## Test Files

| File | Covers |
|---|---|
| `tests/auth.spec.ts` | Admin/restaurant login, customer registration via API |
| `tests/customer-order-flow.spec.ts` | API: place order, check status, cancel, restaurant sees new order |
| `tests/restaurant-order-management.spec.ts` | Kanban board, accept/prepare/ready actions |
| `tests/admin-dashboard.spec.ts` | KPI cards, driver map, orders table, filters |
| `tests/realtime-tracking.spec.ts` | Status propagation, admin reflects live changes |
| `tests/maplibre-basemap.spec.ts` | Keyless OpenFreeMap style, MapLibre canvas, attribution, and console-error gate |
| `tests/batch4-contract.spec.ts` | Batch 4 API contracts and axe serious/critical accessibility smoke |
| `tests/accessibility-critical.spec.ts` | Critical Admin and Restaurant pages, keyboard focus, and axe serious/critical gate |
| `tests/tenant-isolation.spec.ts` | Restaurant and customer tenant boundaries |
| `tests/visual-contract.spec.ts` | Responsive visual-structure and mobile-navigation contracts |

The Chromium project opts into SwiftShader only for trusted E2E content so WebGL map tests stay deterministic on GPU-less local and CI runners. These launch flags are test-only and are never used by deployed browsers or containers.

## Debugging

```bash
# Interactive UI mode (recommended for development)
pnpm test:e2e:ui

# Run a single spec with headed browser
npx playwright test tests/auth.spec.ts --config=e2e/playwright.config.ts --headed

# Debug mode (pauses at each step)
npx playwright test tests/auth.spec.ts --config=e2e/playwright.config.ts --debug

# View trace from a failed run
npx playwright show-report web/e2e/playwright-report
```

## CI Integration

The `.github/workflows/e2e.yml` workflow:
1. Builds and starts the isolated `docker-compose.e2e.yml` overlay.
2. Reruns Prisma migration and seeds disposable data through port `15432`.
3. Restarts the separate worker, then requires `FoodFlow Worker started` and `RAG sync complete` in its logs.
4. Runs Chromium, Firefox, and Pixel 5 against `13000`/`13001`/`13002`.
5. Uploads `playwright-report/` and traces on failure, then removes the isolated stack.

This describes configured workflow behavior, not a successful remote execution. Artifacts are retained for 14 days. To investigate a CI failure, download the artifact and run `npx playwright show-report`.

## Seed Credentials

These accounts are created by `backend/prisma/big-seed.ts`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@foodflow.vn` | `Admin@123` |
| Restaurant owner | `restaurant1@foodflow.vn` | `Partner@123` |
| Customer | `customer1@foodflow.vn` | `Customer@123` |
| Driver | `driver1@foodflow.vn` | `Driver@123` |
