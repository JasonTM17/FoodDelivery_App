# FoodFlow — Food Delivery Operations Platform

Documentation: **English** · [Tiếng Việt](docs/readme.vi.md) · [日本語](docs/readme.ja.md)

<p align="center">
  <img src="https://img.shields.io/badge/backend-NestJS%2011-ea2845?logo=nestjs" alt="NestJS 11 backend" />
  <img src="https://img.shields.io/badge/web-Next.js%2015-000000?logo=next.js" alt="Next.js 15 web" />
  <img src="https://img.shields.io/badge/mobile-Flutter-02569B?logo=flutter" alt="Flutter mobile" />
  <img src="https://img.shields.io/badge/data-Supabase%20%2B%20PostGIS-3FCF8E?logo=supabase" alt="Supabase and PostGIS" />
  <img src="https://img.shields.io/badge/containers-Docker%20Hub-2496ED?logo=docker" alt="Docker Hub" />
  <img src="https://img.shields.io/github/license/JasonTM17/FoodDelivery_App" alt="MIT license" />
</p>

FoodFlow is a multi-tenant food-delivery system with a NestJS API, professional Admin and Restaurant dashboards, and Flutter customer/driver applications. Its managed-production design uses Supabase for PostgreSQL/PostGIS, Realtime, and Storage; Railway for the API, worker, and Redis; and Vercel for the Admin and Restaurant dashboards. Docker Compose keeps a separate Socket.IO/Redis/MinIO compatibility profile for local development and self-hosting.

> **Release status — 2026-07-12:** Batch 4 integration is on `master`, but it is **not production-deployed**. Local unit/type/build gates and fresh migration validation passed; Supabase remote database connectivity is timing out, Railway is not authenticated/configured, and production secrets/public build values are not yet in their provider stores. Deployment remains fail-closed.

## Product preview

These are historical non-production media. The manifest records `capturedAt` 2026-07-10 but no source SHA or image reference, so the images do not prove the current source head or any release candidate. See the [full product gallery](docs/product-gallery.md).

<p align="center">
  <img src="docs/screenshots/admin/02-overview.png" alt="FoodFlow Admin overview" width="48%" />
  <img src="docs/screenshots/restaurant/04-menu.png" alt="FoodFlow Restaurant menu" width="48%" />
</p>

| Admin sign-in to overview | Restaurant orders to menu |
|---|---|
| ![Admin sign-in flow](docs/media/gifs/admin-login-flow.gif) | ![Restaurant navigation](docs/media/gifs/restaurant-orders-to-menu.gif) |

## Applications

| Surface | Source | Runtime | Local URL |
|---|---|---|---|
| Backend API | `backend/` | NestJS 11, Prisma 6 | `http://localhost:3001/api` |
| Admin | `web/apps/admin/` | Next.js 15, React 18, next-intl | `http://localhost:3000` |
| Restaurant | `web/apps/restaurant/` | Next.js 15, React 18, next-intl | `http://localhost:3002` |
| Customer | `mobile/lib/main_customer.dart` | Flutter/Riverpod | device or emulator |
| Driver | `mobile/lib/main_driver.dart` | Flutter/Riverpod | device or emulator |

Admin and Restaurant routes are locale-prefixed for `vi`, `en`, and `ja`. The API uses a shared success envelope (`{ success: true, data, meta? }`) and RFC 7807 Problem Details for errors.

## Capabilities

- Customer ordering, carts, addresses, vouchers, wallet/COD/SePay, reviews, support, and AI assistance.
- Driver online state, dispatch offers, fresh GPS validation, route guidance, ETA, heatmaps, earnings, KYC, and incentives.
- Restaurant order kanban, menu/options, promotions, revenue, reviews, notifications, staff, opening hours, and insights.
- Admin KPIs, orders, restaurants, users, drivers, live maps, promotions, audit, support, export, and AI telemetry.
- Tenant-scoped authorization for restaurant staff, realtime channels, tracking, exports, and administrative resources.
- Keyless MapLibre/OpenFreeMap basemaps plus backend Google Directions/owned OSRM routing when configured; route snapshots and telemetry fail closed instead of inventing coordinates, polylines, or ETA.
- DeepSeek-backed support through the backend adapter, with fail-closed configuration/provider errors, persisted usage telemetry, and no embedded provider key.

## Production and local architecture

```text
Flutter customer/driver ─┐
Admin + Restaurant web ──┼── HTTPS ──> NestJS API on Railway
                         │                  │
                         │                  ├── Supabase PostgreSQL/PostGIS
                         │                  ├── Supabase private Broadcast + scoped JWT
                         │                  ├── Supabase Storage
                         │                  ├── Railway managed Redis
                         │                  └── Postgres job outbox + worker
                         └── authorized Supabase channel subscriptions

Local/self-hosted compatibility: PostgreSQL + Socket.IO + Redis/BullMQ + MinIO
```

Provider selection is explicit:

| Concern | Managed production | Local/self-hosted compatibility |
|---|---|---|
| Database | Supabase PostgreSQL/PostGIS | PostGIS container |
| Realtime | `REALTIME_PROVIDER=supabase` | `socketio` |
| Storage | `STORAGE_PROVIDER=supabase` | `minio` |
| Queue | `QUEUE_PROVIDER=supabase-postgres` | `bullmq` |

Admin, Restaurant, Customer, and Driver clients obtain short-lived, tenant-scoped realtime credentials from `POST /api/realtime/token` in managed mode. Mobile publishes GPS and dispatch decisions through authenticated REST and receives only allow-listed private Supabase Broadcast events; Socket.IO remains an explicit local/self-hosted compatibility provider.

## Docker packages

The current candidate has immutable Docker Hub images for the API/worker and migrator. Admin and Restaurant images remain gated until verified public API and Supabase build values exist. `latest` remains on the prior candidate until the SHA artifacts below pass provider deployment and production smoke.

| Artifact | Docker Hub tag | Remote digest |
|---|---|---|
| API + worker | [`nguyenson1710/foodflow-backend:sha-a627b597796965f4b991a5ab236a1fdedafa0b30`](https://hub.docker.com/r/nguyenson1710/foodflow-backend) | `sha256:1e16888fa61ca5816d44011237858b71e9a49898af373ce74d05a68b9e71aa41` |
| Prisma migrate | [`nguyenson1710/foodflow-migrate:sha-a627b597796965f4b991a5ab236a1fdedafa0b30`](https://hub.docker.com/r/nguyenson1710/foodflow-migrate) | `sha256:f6088d0455fa55aff01eb5067225eb1b9f14044b5aae2bf6e2ee424aaf024fec` |
| Admin | gated | requires verified `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Restaurant | gated | requires verified `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

The worker runs from the backend image with `dist/workers/main.js`; it is not a separately maintained release artifact. Docker Hub was queried after push and both SHA tags were pulled again for a Linux/amd64 local runtime smoke: API health returned 200 and both runtimes preserved their non-root users. Docker Scout found zero High/Critical CVEs for those Linux/amd64 images. Multi-architecture scanning, provider deployment, and production smoke are still required before semver or `latest` promotion.

Release promotion order:

1. Build and push `sha-<full-commit>`.
2. Pull that SHA in a clean environment; run compose smoke and block High/Critical image findings.
3. Pass Supabase/Railway/Vercel production health and authenticated tracking smoke.
4. Build and scan every supported architecture, then create immutable `v4.0.0`.
5. Promote `latest` only through an explicit manual release action.

For self-hosting, pin `IMAGE_TAG=v4.0.0` or `sha-<full-commit>` and use the base Compose file plus `docker-compose.prod.yml`. Never deploy an unverified `latest` tag.

## Repository layout

| Path | Purpose |
|---|---|
| `backend/` | API, Prisma schema/migrations, Vercel handler, worker entry |
| `web/` | pnpm workspace: Admin, Restaurant, shared packages, Playwright |
| `mobile/` | Flutter customer and driver entry points plus shared API client |
| `infra/` | Compose overlays, preflight, security, and release tooling |
| `docs/` | Architecture, API/OpenAPI, deployment, testing, security, product media |
| `e2e/` | Cross-surface and AI smoke scenarios |

Generated output, local agent files, dotenv files, credentials, and private plans are ignored and must not be committed.

## Prerequisites

- Node.js 22.13 or newer
- Corepack + pnpm 11.11.0
- Docker Desktop/Engine
- Flutter SDK matching `mobile/pubspec.yaml`
- Railway CLI authenticated to the project that owns the API, worker, migrator, and Redis
- Provider credentials only for the integration being exercised

## Local development

Copy only example files to ignored local dotenv files. Do not put real credentials in tracked files.

```bash
# Infrastructure
docker compose up -d postgres redis minio

# API
cd backend
corepack pnpm install --frozen-lockfile
corepack pnpm prisma generate
corepack pnpm prisma migrate dev
corepack pnpm db:seed
corepack pnpm start:dev

# Admin + Restaurant
cd ../web
corepack pnpm install --frozen-lockfile
corepack pnpm dev

# Customer or Driver
cd ../mobile
flutter pub get --enforce-lockfile
flutter run -t lib/main_customer.dart
flutter run -t lib/main_driver.dart
```

Or build the isolated full stack:

```bash
docker compose up -d --build
```

Health endpoints:

- API: `GET http://localhost:3001/api/healthz`
- Admin: `GET http://localhost:3000/api/healthz`
- Restaurant: `GET http://localhost:3002/api/healthz`

## Secrets and production preflight

- Treat any key pasted into chat, logs, screenshots, tickets, or git history as exposed and rotate it before production.
- Never commit `.env`, database URLs, service-role keys, JWT secrets, private keys, provider tokens, or mobile signing files.
- The Supabase anon/publishable key is a public identifier but still requires RLS and origin controls. MapLibre/OpenFreeMap needs no browser API key or billing account.
- Keep DeepSeek, Supabase service role/JWT, SePay, SMTP, FCM, Twilio, database, and deployment credentials server-side.

Run preflights without printing values:

```powershell
powershell -File infra/scripts/supabase-preflight.ps1
powershell -File infra/scripts/railway-preflight.ps1
powershell -File infra/scripts/vercel-web-preflight.ps1
```

Current blockers are recorded in the [Batch 4 release report](docs/batch4-release-report.md). No deploy is authorized while either preflight fails.

## Verification

```powershell
# Complete local gate; production env/auth must be configured
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

The gate covers frozen installs, Prisma validation, backend typecheck/lint/Jest/build, web typecheck/ESLint/Vitest/build, OpenAPI Spectral, Compose config, Chromium + Firefox, Flutter analyze/test, and high-confidence secret checks. Additional release evidence includes axe serious/critical, visual regression, tenant isolation, realtime authorization, maps/routes, AI fail-closed/live smoke, and multi-architecture image scans.

The 2026-07-13 hardening pass verified Backend 135 suites / 1008 tests plus typecheck, lint, and build; Admin 192 and Restaurant 130 unit tests plus production builds; Flutter analyze and a 325-test full run before the final availability-race patch, followed by four focused session/race tests. Browser E2E against the older Docker stack passed 128/134 checks; six checks correctly remain non-evidence because that stack lacks the current navigation build and its test database was not seeded. Live Firebase delivery and a current-SHA browser rerun remain required.

## Deployment order

1. Restore GitHub Actions billing/auth and obtain fresh green remote checks.
2. Rotate exposed credentials; complete Supabase, Railway, and Vercel preflights.
3. Deploy Supabase migrations, RLS, private Broadcast authorization, and Storage bucket policies.
4. Run the Railway migrator, then deploy the Railway API, worker, and managed Redis; verify health and WebSocket origin.
5. Build/deploy Admin and Restaurant on Vercel with the verified Railway API and Supabase public values.
6. Smoke health, auth, tenant isolation, realtime, map/shipper route, chatbot, notifications, exports, and payments.
7. Do not recreate or push historical integration branches. Reconcile the verified local `master` head with `origin/master` only after the required release gates authorize it.
8. Publish immutable Docker manifests, then update `latest` only after production smoke.

## Documentation

- [Product gallery](docs/product-gallery.md)
- [Project overview and requirements](docs/project-overview-pdr.md)
- [System architecture](docs/system-architecture.md)
- [API contract](docs/api-contract.md) and [OpenAPI](docs/openapi.yaml)
- [Deployment guide](docs/deployment-guide.md)
- [Docker/local guide](docs/docker-local-dev-guide.md)
- [Testing guide](docs/testing-guide.md)
- [AI chatbot guide](docs/ai-chatbot-guide.md)
- [Security guide](docs/security-audit-guide.md)
- [Roadmap](docs/project-roadmap.md)
- [Branch disposition](docs/branch-disposition.md)
- [Batch 4 release report](docs/batch4-release-report.md)

## Branch policy

The remote has one branch, `master`. No historical local integration/finalization ref or linked integration worktree remains. Branch equivalence is not release approval; do not recreate, raw-merge, or push historical integration branches by name.

## License

[MIT](LICENSE)
