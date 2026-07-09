# FoodFlow Deployment Guide

Languages: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## Deployment Principle

FoodFlow deploys only after the integration branch is clean, pushed, reviewed, and verified. Do not deploy from a dirty root worktree, with unrotated pasted keys, or while any Batch 4 gate is red.

Current Batch 4 status on 2026-07-09: remote cleanup was rechecked at `118459e539eecb2dbd61e033431b7f4b5104f0e0`, where `git ls-remote --heads origin` returned only `refs/heads/master`. Latest local code head before the current docs refresh is `f5ba366` and remains 71 commits ahead of `origin/master` as a fast-forward candidate. The refreshed local Docker stack rebuilt Backend/Admin/Restaurant from current source, passed all three health checks, and Playwright Chromium/Firefox passed 70/70 with axe serious/critical smoke, visual contract, realtime, and tenant isolation coverage. New Supabase realtime/storage/queue foundation passed backend typecheck/lint/build and full Jest 116 suites / 849 tests. The branch remains ahead of `origin/master` until production prerequisites are valid. See [Batch 4 release report](batch4-release-report.md). This is local verification evidence, not production deployment approval.

Vercel project shells now exist for API/Admin/Restaurant and have expected roots/build settings. Deployment is still intentionally blocked until required production env vars are present, current-head checks are green, pasted keys are rotated, Supabase CLI/auth is available, database migrations are deployed, and production health checks are valid.

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

Latest deploy-readiness check on 2026-07-09: Vercel CLI auth is present. API project `foodflow-api`, Admin project `food-delivery-app`, and Restaurant project `foodflow-restaurant` exist and have expected roots/build settings. Generated app-owned `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CRON_SECRET` were set directly as sensitive production env vars on `foodflow-api` without printing values. Known non-secret provider/public env defaults were also added where safe. Vercel preflight still fails because real external production env values are missing. Supabase MCP OAuth login succeeded for project ref `lvanszgszzfopusboich`, but Supabase CLI deployment remains blocked until `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`, and `DIRECT_URL` are available to the release shell. Docker Publish targets `master`, matching the only live remote branch. No production deployment was performed.

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

## Vercel Deployment

Deploy web only after `pnpm --filter foodflow-admin build` and `pnpm --filter restaurant build` pass.

Recommended project mapping:

| Vercel project | Root directory | Build command |
|---|---|---|
| `foodflow-api` | `backend` | `pnpm prisma generate && pnpm build` |
| `food-delivery-app` | `web/apps/admin` | `cd ../.. && pnpm --filter foodflow-admin build` |
| `foodflow-restaurant` | `web/apps/restaurant` | `cd ../.. && pnpm --filter restaurant build` |

Current Vercel Admin project setting:

| Setting | Value |
|---|---|
| Project | `food-delivery-app` |
| Root Directory | `web/apps/admin` |
| Framework | Next.js |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Build Command | `cd ../.. && pnpm --filter foodflow-admin build` |
| Output Directory | `.next` |

Current Vercel API/Restaurant project settings:

| Project | Root Directory | Framework | Install Command | Build Command | Output |
|---|---|---|---|---|---|
| `foodflow-api` | `backend` | Other | `pnpm install --frozen-lockfile` | `pnpm prisma generate && pnpm build` | Vercel Functions via `backend/vercel.json` |
| `foodflow-restaurant` | `web/apps/restaurant` | Next.js | `cd ../.. && pnpm install --frozen-lockfile` | `cd ../.. && pnpm --filter restaurant build` | `.next` |

Required public env:

| App | Variable |
|---|---|
| Admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_REALTIME_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Restaurant | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RESTAURANT_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_REALTIME_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

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
