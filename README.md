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

FoodFlow is a multi-tenant food-delivery system with a NestJS API, professional Admin and Restaurant dashboards, and Flutter customer/driver applications. Its managed-production design uses Supabase for PostgreSQL/PostGIS, Realtime, and Storage, with the API and both web dashboards on Vercel. Docker Compose keeps a separate Socket.IO/Redis/MinIO compatibility profile for local development and self-hosting.

> **Release status — 2026-07-11:** Batch 4 hardening is still in progress and is **not production-deployed**. Supabase CLI credentials and required Vercel production variables are incomplete, and fresh remote CI is unavailable because GitHub Actions billing/auth is exhausted. Deployment and the `master` fast-forward remain fail-closed until the complete final-head gates and provider preflights pass.

## Product preview

These images were captured from the current-source isolated Docker stack with deterministic seeded test data. They are not presented as production screenshots. See the [full product gallery](docs/product-gallery.md).

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
Admin + Restaurant web ──┼── HTTPS ──> NestJS API on Vercel
                         │                  │
                         │                  ├── Supabase PostgreSQL/PostGIS
                         │                  ├── Supabase Realtime outbox + scoped JWT
                         │                  ├── Supabase Storage
                         │                  └── Postgres job outbox + secured Vercel Cron
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

Admin, Restaurant, Customer, and Driver clients obtain short-lived, tenant-scoped realtime credentials from `POST /api/realtime/token` in managed mode. Mobile publishes GPS and dispatch decisions through authenticated REST and receives only allow-listed Supabase outbox events; Socket.IO remains an explicit local/self-hosted compatibility provider.

## Docker packages

The current Batch 4 candidate publishes immutable, repository-linked images to both Docker Hub and GitHub Container Registry. Only the API/worker and migration artifacts are published at the current commit; Admin and Restaurant remain gated until the required public Supabase build variables are present.

| Artifact | Docker Hub | GitHub Packages | Immutable manifest digest |
|---|---|---|---|
| API + worker | [`nguyenson1710/foodflow-backend`](https://hub.docker.com/r/nguyenson1710/foodflow-backend) | [`ghcr.io/jasontm17/foodflow-backend`](https://github.com/users/JasonTM17/packages/container/package/foodflow-backend) | `sha256:399cc6a03ab5b582c4b771ac3b93711d5a823f9dc83c146e932b8ffdf6cd8ed0` |
| Prisma migrate | [`nguyenson1710/foodflow-migrate`](https://hub.docker.com/r/nguyenson1710/foodflow-migrate) | [`ghcr.io/jasontm17/foodflow-migrate`](https://github.com/users/JasonTM17/packages/container/package/foodflow-migrate) | `sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756` |
| Admin | gated | gated | requires verified `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Restaurant | gated | gated | requires verified `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

Both published manifests use tag `sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0`, contain `linux/amd64` and `linux/arm64`, and carry SBOM/provenance attestations plus the repository OCI source annotation. Docker Hub and GHCR resolve to the same digest for each artifact. The worker runs from the backend image with `dist/workers/main.js`; it is not a separately maintained release artifact. Existing `latest` tags are **not** the Batch 4 release source of truth and will not be promoted before production smoke.

Release promotion order:

1. Build and push `sha-<full-commit>` for `linux/amd64` and `linux/arm64`.
2. Smoke native dependencies on both architectures and block High/Critical Trivy findings.
3. Pass production health checks.
4. Create immutable `v4.0.0`; refuse overwrite if its digest differs.
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
powershell -File infra/scripts/vercel-web-preflight.ps1
```

Current blockers are recorded in the [Batch 4 release report](docs/batch4-release-report.md). No deploy is authorized while either preflight fails.

## Verification

```powershell
# Complete local gate; production env/auth must be configured
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

The gate covers frozen installs, Prisma validation, backend typecheck/lint/Jest/build, web typecheck/ESLint/Vitest/build, OpenAPI Spectral, Compose config, Chromium + Firefox, Flutter analyze/test, and high-confidence secret checks. Additional release evidence includes axe serious/critical, visual regression, tenant isolation, realtime authorization, maps/routes, AI fail-closed/live smoke, and multi-architecture image scans.

Latest current-line evidence includes 48 focused backend KYC/config/notification tests, backend typecheck/lint, all 274 Flutter tests, Flutter analyze, a real Driver debug APK build from `lib/main_driver.dart`, Admin KYC contract/typecheck with 5 component tests, and clean OpenAPI Spectral validation. Earlier broader web/container/browser evidence is retained in the release report, but a fresh all-suites final-head gate is still required before release.

## Deployment order

1. Restore GitHub Actions billing/auth and obtain fresh green remote checks.
2. Rotate exposed credentials; complete Supabase and Vercel preflights.
3. Deploy Supabase migrations, RLS, explicit Realtime publication/channels, and Storage bucket policies.
4. Deploy Vercel API, then configure its verified alias and health/Cron paths.
5. Build/deploy Admin and Restaurant with the verified API and Supabase public values.
6. Smoke health, auth, tenant isolation, realtime, map/shipper route, chatbot, notifications, exports, and payments.
7. Fast-forward local integration `HEAD` directly to `origin/master`; keep one remote branch.
8. Publish immutable Docker manifests, then update `latest` only after production smoke.

## Documentation

- [Product gallery](docs/product-gallery.md)
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

The remote currently has one branch: `master`. At the 2026-07-11 audit baseline, local `codex/batch4-integration@924808c` was a clean fast-forward candidate 106 commits ahead of `origin/master@df945dd`. Do not push the local branch by name because that would recreate a second remote branch; after every release gate passes, push its verified `HEAD` directly to `master`. Never raw-merge stale branches or delete refs without patch-equivalence and backup checks.

## License

[MIT](LICENSE)
