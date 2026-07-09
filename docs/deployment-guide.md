# FoodFlow Deployment Guide

Languages: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## Deployment Principle

FoodFlow deploys only after the integration branch is clean, pushed, reviewed, and verified. Do not deploy from a dirty root worktree, with unrotated pasted keys, or while any Batch 4 gate is red.

Current Batch 4 status on 2026-07-06: `origin/master` is `64e46c795c9c15ae52bb0112f91e93a6f3851645`, and `git ls-remote --heads origin` returns only `refs/heads/master`. Local backend, web, Docker, Playwright Chromium/Firefox, mobile, OpenAPI, compose, and fallback secret-scan gates passed for this head; see [Batch 4 release report](batch4-release-report.md). This is local verification evidence, not production deployment approval. Supabase and Vercel deployment remain blocked until GitHub Actions access is restored, current-head remote checks are green, production secrets are rotated/valid, Supabase CLI/auth is available, and this repo is linked to the intended Vercel projects.

## Docker Hub images (primary package path)

Public images under namespace **`nguyenson1710`**:

| Image | Role |
|---|---|
| `nguyenson1710/foodflow-backend` | Nest API (`dist/main.js`) |
| `nguyenson1710/foodflow-worker` | Same layers as backend; run `dist/workers/main.js` |
| `nguyenson1710/foodflow-migrate` | Prisma migrate deploy (builder stage) |
| `nguyenson1710/foodflow-admin` | Admin Next.js |
| `nguyenson1710/foodflow-restaurant` | Restaurant Next.js |

Tags: `latest` and short git SHA (e.g. `5dfcc5b`). CI workflow `.github/workflows/docker-publish.yml` publishes on push to `master`/`main`.

### Pull + run (production overlay)

```bash
# secrets: copy .env.production.example → .env.production
export IMAGE_TAG=latest
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Worker uses the backend image with command override `dist/workers/main.js`.

### Manual build/push (if CI secrets missing)

```bash
# after docker login as nguyenson1710
docker build -t nguyenson1710/foodflow-backend:latest -f backend/Dockerfile backend
docker build -t nguyenson1710/foodflow-migrate:latest --target migrator -f backend/Dockerfile backend
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

## Required Secret Stores

Use provider secret managers, not committed files:

| Area | Required secrets |
|---|---|
| Backend auth | `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| Database/cache | `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, passwords |
| Storage | MinIO/S3 access key and secret key |
| SePay | `SEPAY_API_KEY`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_WEBHOOK_SECRET` |
| AI | `DEEPSEEK_API_KEY` or the configured LLM provider key |
| Maps | backend `GOOGLE_MAPS_API_KEY` and owned `OSRM_URL`; Admin/Restaurant browser `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Deploy CLIs | Vercel token, Supabase access token |

Any key pasted into chat, logs, screenshots, tickets, or git history must be rotated before production.

Required non-secret production config: set `DELIVERY_BASE_FEE_VND` to the approved checkout base delivery fee. Backend boot validation rejects missing pricing config so orders are not created with hardcoded MVP fees.

Latest deploy-readiness check: Vercel CLI auth is present, but this repository is not linked to a Vercel project and the account project list did not show FoodFlow projects. Supabase CLI was not installed in the local PATH. No production deployment was performed.

## Supabase Deployment

Supabase is used only after backend contracts and migrations are green.

1. Create a Supabase project.
2. Store the Supabase pooled transaction-mode Postgres URL as backend `DATABASE_URL`.
3. Store the Supabase direct/session-mode Postgres URL as backend `DIRECT_URL`; Prisma uses it for migrations through `directUrl`.
4. Run Prisma validation and migrations against a staging database first:

   ```bash
   cd backend
   pnpm prisma validate
   pnpm prisma migrate deploy
   ```

5. Enable realtime only for tables that require live updates. Keep tenant isolation checks enabled in E2E before exposing production data.
6. Store Supabase service keys only in backend/server secret stores. Never expose service-role keys to web or mobile clients.

Example env shape:

```bash
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres"
```

## Vercel Deployment

Deploy web only after `pnpm --filter foodflow-admin build` and `pnpm --filter restaurant build` pass.

### Recommended project mapping

| Vercel project | Root directory | Install command | Build command | Node |
|---|---|---|---|---|
| Admin (`food-delivery-app`) | **`web`** (not `web/apps/admin`) | `pnpm install --frozen-lockfile` | `pnpm --filter foodflow-admin build` | **22.x** |
| Restaurant (`foodflow-restaurant`) | **`web`** | `pnpm install --frozen-lockfile` | `pnpm --filter restaurant build` | **22.x** |

Do **not** deploy the NestJS API (`foodflow-api`) to Vercel. Socket.IO, BullMQ workers, Redis rate limits, and Prisma migrations need a long-running Docker/VPS process. Keep backend on Docker Compose / container host.

### Required public env (Preview + Production)

| App | Variable | Notes |
|---|---|---|
| Both | `NEXT_PUBLIC_APP_ENV=production` | Triggers fail-closed URL validation |
| Both | `NEXT_PUBLIC_API_URL` | HTTPS public API, e.g. `https://api.example.com/api` |
| Both | `NEXT_PUBLIC_WS_URL` | Public Socket.IO origin, e.g. `https://api.example.com` |
| Both | `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Real browser key (not `your-*` placeholder) |
| Admin | `NEXT_PUBLIC_ADMIN_URL` | Canonical admin HTTPS URL |
| Restaurant | `NEXT_PUBLIC_RESTAURANT_URL` | Canonical restaurant HTTPS URL |

Both web apps intentionally fail closed in production when API, realtime, canonical app URL, or required map key env is missing. Localhost defaults are dev-only. Do not enable `FOODFLOW_ENABLE_DEV_API_REWRITE` in Vercel; it is only for local Restaurant dev proxying.

Restrict `NEXT_PUBLIC_GOOGLE_MAPS_KEY` by HTTP referrer in Google Cloud.

### Why recent Codex deploys failed (2026-07-09)

Observed on Vercel account projects:

- `food-delivery-app` had many **Preview Error** deploys (~1m each); Production URL returned **404**.
- Project root was `web/apps/admin` with `cd ../.. && pnpm ...` (fragile monorepo path).
- Node was set to **24.x** while Docker/tooling targets **22**.
- `foodflow-restaurant` and `foodflow-api` had **zero** successful deployments.
- Local **production-mode** builds succeed when all `NEXT_PUBLIC_*` HTTPS vars are set.

Checklist before `vercel --prod`:

1. Clean git tree; push current `master`.
2. Fix project Root Directory → `web`, Node → `22.x`.
3. Set every required env on Preview and Production.
4. Confirm public backend API is reachable from the browser (CORS + HTTPS). Without a public API, Vercel UI will build but login will fail.

## Backend Deployment

The backend can run via Docker, VPS, or a managed container platform.

Minimum production checklist:

- Run `pnpm prisma migrate deploy` before serving traffic.
- Set `NODE_ENV=production`.
- Backend boot validation rejects missing production infra secrets and localhost defaults. Configure `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, 64+ character JWT secrets, `PASSWORD_RESET_URL_BASE`, exact `CORS_ORIGINS`, and MinIO/S3 values before starting the API or workers.
- Configure CORS to exact production dashboard/mobile origins.
- Configure SePay webhook URL and `SEPAY_WEBHOOK_SECRET`.
- Configure Redis for Socket.IO/realtime and rate limiting.
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

Alert on repeated failures. Do not use keep-alive to mask failed migrations, missing secrets, or broken realtime connections.

## Pre-Deploy Gates

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
