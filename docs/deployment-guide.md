# FoodFlow Deployment Guide

Languages: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## Deployment Principle

FoodFlow deploys only after the integration branch is clean, pushed, reviewed, and verified. Do not deploy from a dirty root worktree, with unrotated pasted keys, or while any Batch 4 gate is red.

Current Batch 4 status on 2026-07-07: remote cleanup was rechecked at `118459e539eecb2dbd61e033431b7f4b5104f0e0`, where `git ls-remote --heads origin` returned only `refs/heads/master`. Local backend, web, Docker, Playwright Chromium/Firefox, mobile, OpenAPI, compose, and high-confidence secret-scan gates passed for the validated code line before this hardening refresh; see [Batch 4 release report](batch4-release-report.md). This is local verification evidence, not production deployment approval.

The Vercel project `food-delivery-app` now exists and is linked to the GitHub repo. Its project settings were corrected from repo root/`Other` to Admin's monorepo app root `web/apps/admin` with Next.js build settings. Deployment is still intentionally blocked until required production env vars are present, current-head checks are green, pasted keys are rotated, Supabase CLI/auth is available, and backend/API production endpoints are valid.

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
| Admin web public env | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Deploy CLIs | Vercel token, Supabase access token |

Any key pasted into chat, logs, screenshots, tickets, or git history must be rotated before production.

Required non-secret production config: set `DELIVERY_BASE_FEE_VND` to the approved checkout base delivery fee. Backend boot validation rejects missing pricing config so orders are not created with hardcoded MVP fees.

Latest deploy-readiness check: Vercel CLI auth is present and `food-delivery-app` is linked, but `vercel env ls` returned no project env vars. Supabase CLI is available through `npx supabase` (`2.109.0`), but Supabase project access is not authenticated: `npx supabase projects list` fails until `SUPABASE_ACCESS_TOKEN` or `supabase login` is provided. No production deployment was performed.

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

## Vercel Deployment

Deploy web only after `pnpm --filter foodflow-admin build` and `pnpm --filter restaurant build` pass.

Recommended project mapping:

| Vercel project | Root directory | Build command |
|---|---|---|
| FoodFlow Admin | `web` | `pnpm --filter foodflow-admin build` |
| FoodFlow Restaurant | `web` | `pnpm --filter restaurant build` |

Current Vercel Admin project setting:

| Setting | Value |
|---|---|
| Project | `food-delivery-app` |
| Root Directory | `web/apps/admin` |
| Framework | Next.js |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Build Command | `cd ../.. && pnpm --filter foodflow-admin build` |
| Output Directory | `.next` |

Required public env:

| App | Variable |
|---|---|
| Admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Restaurant | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_RESTAURANT_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |

Before deployment, run the web preflight from the repo root. It checks the linked Admin project settings, required production env names, and the required separate Restaurant project env list without printing env values or deploying:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-web-preflight.ps1
```

For POSIX shells with Node.js and Vercel CLI available:

```bash
./infra/scripts/vercel-web-preflight.sh
```

Set `RESTAURANT_VERCEL_PROJECT_ID` before running the preflight once the Restaurant project exists.

Both web apps intentionally fail closed in production when API, realtime, canonical app URL, or required map key env is missing. Localhost defaults are dev-only. Do not enable `FOODFLOW_ENABLE_DEV_API_REWRITE` in Vercel; it is only for local Restaurant dev proxying.

Restrict `NEXT_PUBLIC_GOOGLE_MAPS_KEY` by HTTP referrer in Google Cloud.

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

Alert on repeated failures. Do not use keep-alive to mask failed migrations, missing secrets, or broken realtime connections.

## Pre-Deploy Gates

- From the repo root, run `powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\local-release-gate.ps1 -RunE2E` after production env/auth is configured and seeded local services are running. This wraps local quality gates, OpenAPI Spectral lint, Docker Compose config validation, secret scan, Playwright Chromium/Firefox, and Supabase/Vercel preflight guards without printing secret values.
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
