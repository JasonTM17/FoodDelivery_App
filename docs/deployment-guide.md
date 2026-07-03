# FoodFlow Deployment Guide

Languages: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## Deployment Principle

FoodFlow deploys only after the integration branch is clean, pushed, reviewed, and verified. Do not deploy from a dirty root worktree, with unrotated pasted keys, or while any Batch 4 gate is red.

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
| Maps | backend `GOOGLE_MAPS_API_KEY`; admin browser `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Deploy CLIs | Vercel token, Supabase access token |

Any key pasted into chat, logs, screenshots, tickets, or git history must be rotated before production.

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

Recommended project mapping:

| Vercel project | Root directory | Build command |
|---|---|---|
| FoodFlow Admin | `web` | `pnpm --filter foodflow-admin build` |
| FoodFlow Restaurant | `web` | `pnpm --filter restaurant build` |

Required public env:

| App | Variable |
|---|---|
| Admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Restaurant | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` |

Both web apps intentionally fail closed in production when `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_WS_URL` is missing. Localhost defaults are dev-only. Do not enable `FOODFLOW_ENABLE_DEV_API_REWRITE` in Vercel; it is only for local Restaurant dev proxying.

Restrict `NEXT_PUBLIC_GOOGLE_MAPS_KEY` by HTTP referrer in Google Cloud.

## Backend Deployment

The backend can run via Docker, VPS, or a managed container platform.

Minimum production checklist:

- Run `pnpm prisma migrate deploy` before serving traffic.
- Set `NODE_ENV=production`.
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
- Synthetic flows after release: login, restaurant order queue, admin exports, AI degraded/configured state, driver map loading

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
