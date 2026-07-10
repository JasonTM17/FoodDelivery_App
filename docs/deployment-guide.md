# FoodFlow Deployment Guide

Languages: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## Deployment Principle

FoodFlow deploys only after the integration branch is clean, pushed, reviewed, and verified. Do not deploy from a dirty root worktree, with unrotated pasted keys, or while any Batch 4 gate is red.

Current Batch 4 status on 2026-07-10: `git ls-remote --heads origin` still returns only `refs/heads/master`; the integration head is `9f95f50` plus the current docs commit and remains a fast-forward candidate. Fresh isolated Postgres migration is 22/22, backend Jest is 121 suites / 891 tests, Admin/Restaurant web gates are green, and Playwright Chromium/Firefox is 72/72. Explicit axe smoke is 4/4 with serious/critical violations at zero; visual contract and tenant isolation are also green. See [Batch 4 release report](batch4-release-report.md). This is local verification evidence, not production deployment approval.

Vercel project shells now exist for API/Admin/Restaurant and have expected roots/build settings. Deployment is still intentionally blocked until required production env vars are present, current-head checks are green, pasted keys are rotated, Supabase CLI/auth is available, database migrations are deployed, and production health checks are valid.

## Docker Hub images (primary package path)

Public images under namespace **`nguyenson1710`**:

| Image | Role |
|---|---|
| `nguyenson1710/foodflow-backend` | Nest API (`dist/main.js`) |
| `nguyenson1710/foodflow-worker` | Same layers as backend; run `dist/workers/main.js` |
| `nguyenson1710/foodflow-migrate` | Prisma migrate deploy (builder stage) |
| `nguyenson1710/foodflow-admin` | Admin Next.js |
| `nguyenson1710/foodflow-restaurant` | Restaurant Next.js |

Tags: `latest` and short git SHA (e.g. `0ab94ad`). CI workflow `.github/workflows/docker-publish.yml` publishes on push to `master`/`main` and via **workflow_dispatch**.

**CI secrets (names only):** `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, optional `NEXT_PUBLIC_GOOGLE_MAPS_KEY`.
**Note:** GitHub Actions also needs a paid billing/spending limit. If runs fail with *spending limit*, use manual Hub push below — that path is release-valid.

### Pull + run (production overlay)

```powershell
# secrets: copy .env.production.example → .env.production (fill ALL productionRequiredKeys)
$env:IMAGE_TAG = "latest"   # or short git SHA
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d
# Create MinIO bucket once: foodflow (mc mb local/foodflow)
# Optional seed: docker run --rm --network <compose-net> -e DATABASE_URL=... nguyenson1710/foodflow-migrate:<tag> pnpm run db:seed
```

Worker uses the **backend** image with command override `dist/workers/main.js`.
Prod Redis uses **`noeviction`** (BullMQ). Backend fail-closed production env is documented in `.env.production.example`.
Do not set `MINIO_ACCESS_KEY=minioadmin` in production. In-cluster MinIO is HTTP — set `MINIO_USE_SSL=false` when public CDN URL is HTTPS.

### Manual build/push (if CI secrets or billing block)

```bash
# after docker login as nguyenson1710
docker build -t nguyenson1710/foodflow-backend:latest -f backend/Dockerfile backend
docker build -t nguyenson1710/foodflow-migrate:latest --target migrator -f backend/Dockerfile backend
docker tag nguyenson1710/foodflow-backend:latest nguyenson1710/foodflow-worker:latest
# web apps: pass NEXT_PUBLIC_* build-args (see workflow)
docker push nguyenson1710/foodflow-backend:latest
```

## Local Docker Stack

For host-run development:

```bash
docker compose up -d postgres redis minio
```

For a full local container stack:

```bash
docker compose up -d --build
```

Health checks:

```bash
curl http://localhost:3001/api/healthz
curl http://localhost:3000/api/healthz
curl http://localhost:3002/api/healthz
```

Backend `GET /api/healthz` treats **Postgres + Redis as required** and the selected storage provider as optional. If MinIO or Supabase Storage is down while DB and Redis remain up, the process returns **HTTP 200** with `status: "degraded"` and `components.storage.status: "down"`; DB or Redis down returns **HTTP 503**. `components.storage.provider` identifies the provider that was actually checked.

Local demo seed (`pnpm run db:seed` in `backend/`) also creates a partner-visible demo order (`FF-DEMO01`) and a tagged Admin support ticket so Support and Restaurant order queues are useful in local QA. The seed script refuses to run when `NODE_ENV=production`; production uses reviewed migrations/imports and never demo seed data.

## Required Secret Stores

Use provider secret managers, not committed files:

| Area | Required secrets |
|---|---|
| Backend auth | `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| Database/cache | `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, passwords |
| Storage | Supabase service role key and storage bucket for production; MinIO/S3 access key and secret key only when `STORAGE_PROVIDER=minio` |
| SePay | `SEPAY_API_KEY`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_WEBHOOK_SECRET` |
| AI | `DEEPSEEK_API_KEY` or the configured LLM provider key |
| Maps | backend `GOOGLE_MAPS_API_KEY` and owned `OSRM_URL`; Admin/Restaurant browser `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Realtime | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, web/mobile `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_REALTIME_PROVIDER=supabase` |
| Queue drain | `CRON_SECRET` for `/api/jobs/drain` when `QUEUE_PROVIDER=supabase-postgres` |
| Admin web public env | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_REALTIME_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Restaurant web public env | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RESTAURANT_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_REALTIME_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Deploy CLIs | Vercel token, Supabase access token |

Any key pasted into chat, logs, screenshots, tickets, or git history must be rotated before production.

Required non-secret production config: set `DELIVERY_BASE_FEE_VND` to the approved checkout base delivery fee. Backend boot validation rejects missing pricing config so orders are not created with hardcoded MVP fees.

Latest deploy-readiness check (2026-07-10): Vercel CLI auth is present and the API (`foodflow-api`), Admin (`food-delivery-app`), and Restaurant (`foodflow-restaurant`) projects exist. The preflight still reports missing API production secrets including `DEEPSEEK_API_KEY`, and missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` on both web projects. Supabase CLI deployment remains blocked until the release shell has a valid `SUPABASE_ACCESS_TOKEN`, project ref, `DATABASE_URL`, and `DIRECT_URL`. Any key pasted into chat must be rotated and re-entered through the provider secret manager. Docker Publish targets `master`, which is the intended sole remote branch.

## Supabase Deployment

Supabase is used only after backend contracts and migrations are green.

1. Create a Supabase project.
2. Store the Supabase pooled transaction-mode Postgres URL as backend `DATABASE_URL`.
3. Store the Supabase direct/session-mode Postgres URL as backend `DIRECT_URL`; Prisma uses it for migrations through `directUrl`.
4. Run the Supabase production preflight. It verifies CLI/auth/project visibility and Prisma schema readiness without printing secrets or deploying changes:

   ```bash
   export SUPABASE_ACCESS_TOKEN="..."
   export SUPABASE_PROJECT_REF="..."
   export DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
   export DIRECT_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres"
   ./infra/scripts/supabase-preflight.sh
   ```

   Windows PowerShell:

   ```powershell
   $env:SUPABASE_ACCESS_TOKEN = "..."
   $env:SUPABASE_PROJECT_REF = "..."
   $env:DATABASE_URL = "postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
   $env:DIRECT_URL = "postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres"
   powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\supabase-preflight.ps1
   ```

   To avoid pasting secrets into chat, docs, or shell history, use the local prompt helper for the release shell:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\supabase-env-prompt.ps1
   powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\supabase-env-prompt.ps1 -RunPreflight
   ```

   The helper stores prompted values only in the current PowerShell process, clears them after preflight, never writes `.env` files, and never runs migrations.

5. Run Prisma migrations only after preflight passes:

   ```bash
   cd backend
   pnpm db:migrate:prod
   ```

6. Enable realtime only for tables that require live updates. Keep tenant isolation checks enabled in E2E before exposing production data.
7. Store Supabase service keys only in backend/server secret stores. Never expose service-role keys to web or mobile clients.

Example env shape:

```bash
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres"
```

## Product screenshots

UI stills and GIFs: [product-gallery.md](./product-gallery.md). Regenerate after major UI changes:

```bash
# Requires seeded API + reachable Admin/Restaurant URLs
node docs/scripts/capture-product-media.mjs
```

## Vercel Deployment

Deploy only after backend, Admin, and Restaurant builds pass and their production preflight is green.

### Recommended project mapping

| Vercel project | Root directory | Install command | Build command | Node |
|---|---|---|---|---|
| API (`foodflow-api`) | **`backend`** | `pnpm install --frozen-lockfile` | `pnpm prisma generate && pnpm build` | **22.x** |
| Admin (`food-delivery-app`) | **`web`** (not `web/apps/admin`) | `pnpm install --frozen-lockfile` | `pnpm --filter foodflow-admin build` | **22.x** |
| Restaurant (`foodflow-restaurant`) | **`web`** | `pnpm install --frozen-lockfile` | `pnpm --filter restaurant build` | **22.x** |

The API Vercel target uses the serverless app factory with Supabase Realtime, Storage, and Postgres outbox providers. Docker remains the local/container fallback; do not configure production Socket.IO or BullMQ workers for the Vercel target.

### Required public env (Preview + Production)

| App | Variable | Notes |
|---|---|---|
| Both | `NEXT_PUBLIC_APP_ENV=production` | Triggers fail-closed URL validation |
| Both | `NEXT_PUBLIC_API_URL` | HTTPS public API, e.g. `https://api.example.com/api` |
| Both | `NEXT_PUBLIC_REALTIME_PROVIDER=supabase` | Explicit provider; no Socket.IO fallback |
| Both | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| Both | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase anonymous key |
| Both | `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Real browser key (not `your-*` placeholder) |
| Admin | `NEXT_PUBLIC_ADMIN_URL` | Canonical admin HTTPS URL |
| Restaurant | `NEXT_PUBLIC_RESTAURANT_URL` | Canonical restaurant HTTPS URL |

Before deployment, run the web preflight from the repo root. It checks the linked Admin project settings, required production env names, and the required separate Restaurant project env list without printing env values or deploying:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-web-preflight.ps1
```

For POSIX shells with Node.js and Vercel CLI available:

```bash
./infra/scripts/vercel-web-preflight.sh
```

Override `API_VERCEL_PROJECT`, `ADMIN_VERCEL_PROJECT`, or `RESTAURANT_VERCEL_PROJECT` only if deploying to differently named projects.

If preflight reports missing Vercel production env names, use the local prompt helper instead of pasting secrets into chat, docs, or shell history. The default mode prints the env contract and safe `vercel env add` command shape without calling Vercel:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1
```

To add only the variables that preflight reported missing, pass those names explicitly. Example:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1 -Project api -Names DATABASE_URL,DIRECT_URL -LinkProjects
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1 -Project api -Names DATABASE_URL,DIRECT_URL -PromptValues
```

When `-PromptValues` is used, the helper sends values to `vercel env add` through stdin, uses hidden input for secret variables, uses non-sensitive mode only for public/non-secret config, never writes `.env` files, and never deploys. Re-run `infra\scripts\vercel-web-preflight.ps1` after all values are added.

Both web apps intentionally fail closed in production when API, Supabase realtime, canonical app URL, or required map key env is missing. Localhost defaults are dev-only. Do not enable `FOODFLOW_ENABLE_DEV_API_REWRITE` in Vercel; it is only for local Restaurant dev proxying.

Restrict `NEXT_PUBLIC_GOOGLE_MAPS_KEY` by HTTP referrer in Google Cloud.

Vercel Hobby cron limitation: the committed API cron schedule is daily (`0 17 * * *`) so deployment does not fail on the current Hobby account. Time-sensitive job draining for dispatch retries/order timeouts needs Vercel Pro minute cron or another approved scheduler before production traffic relies on `QUEUE_PROVIDER=supabase-postgres`.

## Backend Deployment

The Batch 4 production target is Vercel Functions for the API plus Supabase Postgres/Realtime/Storage. Docker remains the local/container fallback.

Minimum production checklist:

- Run `pnpm prisma migrate deploy` before serving traffic.
- Set `NODE_ENV=production`.
- Backend boot validation rejects missing production infra secrets and localhost defaults. Configure `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, 64+ character JWT secrets, `PASSWORD_RESET_URL_BASE`, exact `CORS_ORIGINS`, and MinIO/S3 values before starting the API or workers.
- Configure CORS to exact production dashboard/mobile origins.
- Configure SePay webhook URL and `SEPAY_WEBHOOK_SECRET`.
- Set `REALTIME_PROVIDER=supabase`, `STORAGE_PROVIDER=supabase`, and `QUEUE_PROVIDER=supabase-postgres` only after Supabase env values and the secure job drain secret are present.
- Configure Redis for remaining production rate limiting/dedupe paths until they are explicitly replaced; Socket.IO is not required for production realtime when Supabase provider is enabled.
- Keep `THROTTLER_MEMORY_FALLBACK=false` in production so Redis outages fail explicitly instead of weakening rate limits.
- Configure object storage public URL for uploaded assets.
- Expose `/api/healthz` for uptime checks.

## Keep-Alive and Monitoring

Keep-alive should monitor health, not hide broken runtime behavior.

Recommended checks:

- Backend: `GET /api/healthz`
- Admin: `GET /api/healthz`
- Restaurant: `GET /api/healthz`
- Synthetic flows after release: login, restaurant order queue and live tracking map, admin exports, AI degraded/configured state, driver map loading

Run the production health smoke immediately after Vercel promotes deployments:

```powershell
$env:API_URL = "https://<api-domain>/api"
$env:ADMIN_URL = "https://<admin-domain>"
$env:RESTAURANT_URL = "https://<restaurant-domain>"
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\production-health-check.ps1
```

Use `-PlanOnly` to inspect resolved health endpoints without network calls. Use `-AllowHttp -AllowLocal` only for local smoke checks.

After health is green, run the authenticated post-deploy smoke. It verifies that the promoted apps do not serve a Vercel/Next.js 404 shell and that Supabase realtime token issuance, AI chatbot, admin exports, and tracking/map route contracts are working against production-like data. Bearer tokens and smoke IDs are read only from the release shell environment and are never printed or written to files:

```powershell
$env:API_URL = "https://<api-domain>/api"
$env:ADMIN_URL = "https://<admin-domain>"
$env:RESTAURANT_URL = "https://<restaurant-domain>"
$env:FOODFLOW_ADMIN_TOKEN = "<short-lived admin JWT>"
$env:FOODFLOW_CUSTOMER_TOKEN = "<short-lived customer JWT>"
$env:FOODFLOW_RESTAURANT_TOKEN = "<short-lived restaurant JWT>"
$env:FOODFLOW_DRIVER_TOKEN = "<short-lived driver JWT>"
$env:FOODFLOW_SMOKE_ORDER_ID = "<assigned smoke order UUID>"
$env:FOODFLOW_SMOKE_RESTAURANT_ID = "<restaurant UUID>"
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\post-deploy-smoke.ps1 -RequireAuthenticatedChecks
```

Use `-PlanOnly` before a release to inspect endpoints without network calls. Add `-CreateExportJob` when it is acceptable to create a short-lived admin audit-log export job. Add `-RequireRoutePolyline` only when the smoke order has an assigned driver and provider route geometry; otherwise the script still verifies the tracking contract without requiring a polyline. Do not pass `-AllowDegradedAi` for production approval because the chatbot must use a rotated, configured `DEEPSEEK_API_KEY`.

Alert on repeated failures. Do not use keep-alive to mask failed migrations, missing secrets, or broken realtime connections.

## Pre-Deploy Gates

- From the repo root, run `powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\local-release-gate.ps1 -RunE2E` after production env/auth is configured and seeded local services are running. This wraps frozen installs, local quality gates, OpenAPI Spectral lint, Docker Compose config validation, secret scan, Playwright Chromium/Firefox, and Supabase/Vercel preflight guards without printing secret values.
- `pnpm install --frozen-lockfile` in a clean environment for backend and web.
- Backend: Prisma validate/migrate checks, typecheck, lint, Jest, build.
- Web: API client generation/typecheck, Spectral/OpenAPI lint, Admin and Restaurant typecheck/lint/Vitest/build.
- E2E: Playwright Chromium and Firefox with seeded backend/database.
- Accessibility: no axe serious/critical issues.
- Visual: approved Stitch baseline comparison.
- Security: full tracked-file secret scan and staged diff secret scan.
- Tenant isolation: restaurants cannot read or mutate other restaurants' data.

## Rollback

1. Stop traffic to the bad release.
2. Roll back app containers or Vercel deployments.
3. Do not roll back database migrations destructively unless an explicit reversible migration exists and data impact is reviewed.
4. Preserve logs, deployment IDs, and commit hashes for incident review.
