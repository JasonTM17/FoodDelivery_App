# FoodFlow E2E Tests

Playwright test suite covering the four critical user flows: admin dashboard, restaurant order management, customer order placement, and realtime order tracking.

## Prerequisites

- Node 18+ and pnpm 10+
- Docker Compose (for backend stack)
- `@playwright/test` installed (see below)
- Seed data applied (`pnpm db:big-seed` from `backend/`)

## Quick Start

```bash
# 1. Start the backend stack
docker compose up -d

# 2. Seed the database (first time only, or after reset)
cd backend && pnpm db:big-seed && cd ..

# 3. Start both web apps (two terminals)
pnpm --filter admin dev          # → http://localhost:3000
pnpm --filter restaurant dev     # → http://localhost:3002

# 4. Install Playwright browser (once)
cd web && pnpm test:e2e:install

# 5. Run all E2E tests
cd web && pnpm test:e2e
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ADMIN_URL` | `http://localhost:3000` | Admin Next.js app |
| `RESTAURANT_URL` | `http://localhost:3002` | Restaurant Next.js app |
| `API_URL` | `http://localhost:3001/api` | Backend API base URL |

Override via shell: `ADMIN_URL=http://staging.example.com pnpm test:e2e`

## Test Files

| File | Covers |
|---|---|
| `tests/auth.spec.ts` | Admin/restaurant login, customer registration via API |
| `tests/customer-order-flow.spec.ts` | API: place order, check status, cancel, restaurant sees new order |
| `tests/restaurant-order-management.spec.ts` | Kanban board, accept/prepare/ready actions |
| `tests/admin-dashboard.spec.ts` | KPI cards, driver map, orders table, filters |
| `tests/realtime-tracking.spec.ts` | Status propagation, admin reflects live changes |

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
1. Starts Docker Compose (postgres, redis, minio, backend)
2. Seeds the database
3. Starts admin and restaurant apps as background processes
4. Waits for all services to pass health checks
5. Runs the Playwright suite on Chromium only (CI flag)
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
