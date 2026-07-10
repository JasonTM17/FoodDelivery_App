# Docker and Local Development Guide

## Scope

This guide covers local development, isolated E2E, current-source container validation, and self-hosted compatibility. Supabase + Vercel managed production is covered in the [deployment guide](deployment-guide.md).

Local defaults are intentionally convenient and are not production credentials.

## Prerequisites

- Docker Desktop/Engine with Compose v2 and Buildx.
- Node.js 22.13+ with Corepack.
- pnpm 11.11.0 from each package's `packageManager` field.
- Flutter SDK for mobile checks.
- FFmpeg only when regenerating documentation GIFs.

Verify:

```powershell
docker version
docker compose version
docker buildx version
node --version
corepack pnpm --version
flutter --version
ffmpeg -version
```

## Environment rules

Create ignored local files only when host-run commands need them:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item web/apps/admin/.env.example web/apps/admin/.env.local
Copy-Item web/apps/restaurant/.env.example web/apps/restaurant/.env.local
```

- Never commit real dotenv files, CLI auth, dumps, certificates, tokens, or signing material.
- Any credential pasted into chat/logs is exposed and must not be reused for production.
- Local defaults (`foodflow_dev`, `minioadmin`, development JWTs) are forbidden in production.
- Local provider mode is explicit: Socket.IO + Redis/BullMQ + MinIO.
- Managed production mode is explicit: Supabase Realtime/Storage/Postgres queue.

## Mode A: infrastructure only

Run PostGIS, Redis, and MinIO in containers while API/web/mobile run on the host:

```powershell
docker compose up -d postgres redis minio
```

API:

```powershell
cd backend
corepack pnpm install --frozen-lockfile
corepack pnpm prisma generate
corepack pnpm prisma migrate dev
corepack pnpm db:seed
corepack pnpm start:dev
```

Web:

```powershell
cd web
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Mobile:

```powershell
cd mobile
flutter pub get --enforce-lockfile
flutter run -t lib/main_customer.dart
flutter run -t lib/main_driver.dart
```

## Mode B: full local stack

Build migration, API, Admin, and Restaurant from current source:

```powershell
docker compose up -d --build
docker compose ps
```

The migration container must exit `0` before the API becomes healthy. Web public environment values are build-time values; rebuild a web image after changing `NEXT_PUBLIC_*`.

Default endpoints:

| Service | URL |
|---|---|
| API health | `http://localhost:3001/api/healthz` |
| Admin health | `http://localhost:3000/api/healthz` |
| Restaurant health | `http://localhost:3002/api/healthz` |
| MinIO API/console | `http://localhost:9000` / `http://localhost:9001` |

## Mode C: isolated Batch 4 stack

Use this overlay when the root stack or another project must remain untouched:

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.e2e.yml ps
```

Isolated ports:

| Service | Host port |
|---|---|
| Admin | `13000` |
| API | `13001` |
| Restaurant | `13002` |
| Postgres | `15432` |
| Redis | `16379` |
| MinIO API/console | `19000` / `19001` |

The overlay's CORS contract uses `http://localhost:13000` and `http://localhost:13002`. Use `localhost` for normal E2E and media capture; `127.0.0.1` intentionally exercises the CORS error state and will not load business data.

Seed the isolated database from the host when required:

```powershell
$env:DATABASE_URL='postgresql://foodflow:foodflow_dev@localhost:15432/foodflow'
$env:DIRECT_URL=$env:DATABASE_URL
cd backend
corepack pnpm db:seed        # compact deterministic fixtures
corepack pnpm db:big-seed    # broad dashboard/E2E fixtures when explicitly needed
cd ..
Remove-Item Env:DATABASE_URL,Env:DIRECT_URL
```

Both seed commands contain deterministic test business data and are blocked from production use. They are test fixtures, not runtime fallback data.

## Mode D: backend hot reload container

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up backend
```

The override mounts backend source/Prisma and runs the builder stage. Do not use it as release evidence.

## Image architecture

Release artifacts:

| Target | Dockerfile | Runtime |
|---|---|---|
| Backend | `backend/Dockerfile` target `runner` | distroless Node 22, non-root |
| Migrate | `backend/Dockerfile` target `migrator` | distroless Prisma CLI, non-root |
| Admin | `web/apps/admin/Dockerfile` | Next standalone, distroless, non-root |
| Restaurant | `web/apps/restaurant/Dockerfile` | Next standalone, distroless, non-root |

There is no generic `web/Dockerfile` and no separate worker Dockerfile. The worker starts `dist/workers/main.js` from the backend image.

The web workspace installs Linux/glibc `x64` and `arm64` native packages so one native builder can produce standalone artifacts for both final architectures. Backend builder toolchains compile missing native modules; final images contain no compiler.

Build both platforms without publishing:

```powershell
docker buildx build --platform linux/amd64,linux/arm64 \
  --target runner --file backend/Dockerfile --cache-to type=cacheonly backend

docker buildx build --platform linux/amd64,linux/arm64 \
  --target runner --file web/apps/admin/Dockerfile --cache-to type=cacheonly web
```

The release workflow additionally runs bcrypt/BullMQ/MessagePack, Prisma CLI, Sharp PNG, non-root UID, manifest, SBOM/provenance, and Trivy checks on both architectures.

## Local release gate

Complete gate:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass \
  -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Useful development-only partial run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass \
  -File infra/scripts/local-release-gate.ps1 \
  -AllowDirty -SkipInstall -SkipBuild -SkipDeployPreflight
```

Partial runs must be labeled partial and cannot approve release. The full script covers git/diff hygiene, secret scan, frozen installs, Prisma, backend/web/mobile quality gates, OpenAPI, Compose configs, optional browser E2E, and provider preflights.

## Product media

With the isolated stack healthy and seeded:

```powershell
$env:FOODFLOW_ADMIN_URL='http://localhost:13000'
$env:FOODFLOW_RESTAURANT_URL='http://localhost:13002'
$env:FOODFLOW_API_URL='http://localhost:13001/api'
node docs/scripts/capture-product-media.mjs
Remove-Item Env:FOODFLOW_ADMIN_URL,Env:FOODFLOW_RESTAURANT_URL,Env:FOODFLOW_API_URL
```

The script captures real UI/API states, creates palette-optimized GIFs, removes intermediate frames, and writes a non-secret manifest. Review every resulting screenshot; a successful script can still capture a contract/error state.

## Logs and health

```powershell
docker compose ps
docker compose logs --tail 200 migrate backend admin restaurant
Invoke-WebRequest http://localhost:3001/api/healthz
Invoke-WebRequest http://localhost:3000/api/healthz
Invoke-WebRequest http://localhost:3002/api/healthz
```

Do not copy logs into issues/docs until tokens, URLs with credentials, emails, and provider payloads are redacted.

## Data lifecycle

- `docker compose down` stops services and preserves named volumes.
- `docker compose down -v` deletes local Postgres/Redis/MinIO data; use only for an intentional reset after confirming the compose project name.
- Never run recursive container/volume cleanup against all Docker projects on a shared workstation.
- Production migration/backup/restore follows the deployment runbook, not local reset commands.

## Self-hosted compatibility

Use only immutable published image tags:

```powershell
Copy-Item .env.production.example .env.production
$env:IMAGE_TAG='v4.0.0' # or sha-<full-commit>
docker compose --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml up -d
```

This profile uses Socket.IO/Redis/MinIO by design. It is not a fallback for a misconfigured Supabase/Vercel deployment.

## Troubleshooting

- **Wrong API/CORS:** inspect the web image's baked `NEXT_PUBLIC_API_URL` and use a configured origin (`localhost` versus `127.0.0.1` matters).
- **Migration blocks API:** inspect `migrate` logs and database URL; do not bypass `depends_on` or mark migration successful manually.
- **Sharp/native load failure:** rebuild both requested platforms; do not mix Alpine/musl build output with Debian/glibc distroless runtime.
- **Redis unhealthy:** BullMQ requires `maxmemory-policy noeviction`.
- **Maps unavailable:** configure a browser-restricted key and verify real route telemetry; do not add hardcoded coordinates.
- **AI unconfigured:** rotate/add the server key through a secret manager; do not add a fallback response that pretends to be an LLM.
- **Remote CI unavailable:** continue bounded local work and record evidence, but do not deploy, merge to `master`, or publish release tags until CI is restored.
