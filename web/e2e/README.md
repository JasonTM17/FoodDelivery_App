# FoodFlow E2E Tests

Playwright test suite covering the four critical user flows: admin dashboard, restaurant order management, customer order placement, and realtime order tracking.

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

# 3. Build and start the API plus both dashboards
docker compose -f docker-compose.yml -f docker-compose.e2e.yml build backend admin restaurant
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d backend admin restaurant

# 4. Install Playwright browser (once)
cd web && pnpm test:e2e:install

# 5. Run all E2E tests (Chromium, Firefox, and mobile Chromium)
cd web && ADMIN_URL=http://localhost:13000 RESTAURANT_URL=http://localhost:13002 API_URL=http://localhost:13001/api pnpm test:e2e

# Desktop release gate only
ADMIN_URL=http://localhost:13000 RESTAURANT_URL=http://localhost:13002 API_URL=http://localhost:13001/api pnpm test:e2e --project=chromium --project=firefox

# Accessibility gate (fails on axe serious/critical violations)
ADMIN_URL=http://localhost:13000 RESTAURANT_URL=http://localhost:13002 API_URL=http://localhost:13001/api pnpm test:e2e --grep "accessibility" --project=chromium --project=firefox
```

In PowerShell, set `$env:ADMIN_URL`, `$env:RESTAURANT_URL`, and `$env:API_URL`
to the same isolated URLs before invoking `pnpm test:e2e`.

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
1. Starts PostgreSQL, Redis, and MinIO
2. Applies Prisma migrations to a clean database and seeds real data
3. Starts the backend, admin, and restaurant apps
4. Waits for all services to pass health checks
5. Runs the Playwright suite on Chromium and Firefox
6. Uploads `playwright-report/` and trace zips as artifacts on failure

Artifacts are retained for 14 days. To investigate a CI failure, download the artifact and run `npx playwright show-report`.

## Seed Credentials

These accounts are created by `backend/prisma/big-seed.ts`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@foodflow.vn` | `Admin@123` |
| Restaurant owner | `restaurant1@foodflow.vn` | `Partner@123` |
| Customer | `customer1@foodflow.vn` | `Customer@123` |
| Driver | `driver1@foodflow.vn` | `Driver@123` |
