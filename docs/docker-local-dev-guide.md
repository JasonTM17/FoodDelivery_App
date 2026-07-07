# Docker and Local Development Guide

This guide covers the supported local FoodFlow setup for Batch 4. It is intentionally separate from the deployment guide because local Docker defaults are safe for development only and must not be copied into production secret managers.

## Prerequisites

- Docker Desktop or Docker Engine with Compose v2
- Node.js 20+ and pnpm for host-run backend or web commands
- Flutter stable for mobile checks
- A clean worktree when validating release gates

## Environment and secret rules

Copy example files into ignored local env files when you need host-run commands:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item web/apps/admin/.env.example web/apps/admin/.env.local
Copy-Item web/apps/restaurant/.env.example web/apps/restaurant/.env.local
```

Keep production credentials in Supabase, Vercel, or the backend host secret manager. Do not commit `.env`, CLI auth files, storage states, private certificates, database dumps, or provider tokens. Any AI or map key pasted into chat or logs must be treated as exposed and rotated before production.

## Local modes

### Infrastructure only

Use this when you want to run backend, web, or mobile from the host while keeping PostgreSQL/PostGIS, Redis, and MinIO in containers:

```powershell
docker compose up -d postgres redis minio
```

Then run the app-specific commands from the host, for example:

```powershell
cd backend
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
pnpm start:dev
```

### Full standalone stack

Use this for browser E2E and release-style local verification. The web Dockerfiles bake `NEXT_PUBLIC_API_URL` at build time, so set it before rebuilding images:

```powershell
$env:NEXT_PUBLIC_API_URL = "http://[::1]:3001/api"
$env:CORS_ORIGINS = "http://localhost:3000,http://localhost:3002,http://localhost:3003,http://[::1]:3000,http://[::1]:3002,http://[::1]:3003"
docker compose up -d --build backend admin restaurant
```

The compose graph starts PostgreSQL/PostGIS, Redis, MinIO, the migration job, backend, Admin, and Restaurant. The migration job must complete before backend becomes healthy.

### Backend hot reload in Docker

Use the local override when you want backend source and Prisma files mounted into the container:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up backend
```

This mode is for development feedback loops, not release verification.

## Health checks

Check container state first:

```powershell
docker compose ps
```

Then verify service endpoints:

```powershell
Invoke-WebRequest http://[::1]:3001/api/healthz
Invoke-WebRequest http://[::1]:3000/api/healthz
Invoke-WebRequest http://[::1]:3002/api/healthz
```

Use explicit `[::1]` loopback URLs for E2E if another local app is already bound to `127.0.0.1:3000`. The backend CORS defaults include both localhost and `[::1]` development origins.

## Data lifecycle

- Compose volumes persist PostgreSQL, Redis, and MinIO data between restarts.
- `docker compose down` stops the stack without deleting data.
- `docker compose down -v` deletes local database, Redis, and MinIO data. Use it only when you intentionally want a clean local reset.
- Production migrations must use the deployment guide and production secret manager values, not the local compose defaults.

## Local release gates

Run the gates that match the area you touched. Before deploy, all gates must be green:

For a scripted PowerShell gate from the repo root:

```powershell
# Full pre-deploy gate; requires production web/Supabase/Vercel env/auth.
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\local-release-gate.ps1

# Partial local evidence refresh when production env/auth is intentionally absent.
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\local-release-gate.ps1 `
  -SkipBuild `
  -SkipDeployPreflight

# Add browser E2E when the seeded local backend/Admin/Restaurant stack is running.
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\local-release-gate.ps1 `
  -SkipBuild `
  -SkipDeployPreflight `
  -RunE2E
```

The script runs git whitespace checks, high-confidence secret scans, backend Prisma/typecheck/lint/Jest/build, web typecheck/lint/Vitest/build, OpenAPI Spectral lint, Docker Compose config validation, mobile analyze/test, optional Playwright Chromium/Firefox E2E, and the Supabase/Vercel preflight guards unless the matching skip flag is used.

```powershell
cd backend
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

```powershell
cd web
pnpm install --frozen-lockfile
pnpm --filter foodflow-admin typecheck
pnpm --filter foodflow-admin lint
pnpm --filter foodflow-admin test
pnpm --filter foodflow-admin build
pnpm --filter restaurant typecheck
pnpm --filter restaurant lint
pnpm --filter restaurant test
pnpm --filter restaurant build
pnpm test:e2e --project=chromium --project=firefox
```

```powershell
cd mobile
flutter analyze
flutter test
```

Playwright must cover Chromium and Firefox, axe serious/critical accessibility smoke, visual contract checks, and tenant isolation.

## Production guardrails

- The dev compose JWT, MinIO, and database values are local-only.
- Do not enable `FOODFLOW_ENABLE_DEV_API_REWRITE` in Vercel.
- Do not deploy while GitHub Actions auth, billing, or token status is invalid; rerun remote CI after access is restored.
- Deploy Supabase and Vercel only after local gates, secret scans, frozen installs, and production secrets are verified.
- After deploy, verify backend health, web health, realtime orders, maps, chatbot, exports, notifications, tenant isolation, and mobile API connectivity.

## Troubleshooting

- If a distroless web or backend container reports unhealthy, inspect `docker compose logs <service>` and confirm the healthcheck still uses the bundled Node runtime path.
- If Admin appears to call the wrong API, rebuild with the correct `NEXT_PUBLIC_API_URL`; it is a build-time value.
- If maps do not render locally, check the browser map key in the web env file and verify the Google Cloud referrer restrictions.
- If production maps or chatbot fail because a key was exposed, rotate the key first; do not reuse leaked credentials.
- If remote CI cannot run because GitHub Actions access is exhausted, keep working locally and record the last known local gate evidence until remote checks can be rerun.
