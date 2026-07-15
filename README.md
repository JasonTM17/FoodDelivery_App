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

> **Release status — 2026-07-15:** runtime candidate `f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b` passed 145 Jest suites / 1071 tests, typecheck, lint, build, all 10 triggered GitHub workflows, multi-architecture runtime smoke, and eight High/Critical image scans. Railway migrate/API/worker and both Vercel apps run that exact revision; all 41 effective migrations are applied, only the split public/private Storage buckets remain, and public health/readiness/login smoke passes. Three older applied migration files still have unresolved checksum provenance and the pending guard intentionally blocks a later rollout until they are reconciled. A controlled production GPS update reached private Supabase Broadcast and PostGIS in 1437 ms, with test data removed afterward. This is **not** full production certification: controlled-device FCM, the Android/iOS background-location matrix, authenticated role journeys, and configured payment/messaging/AI/owned-routing integrations still need evidence.

## Product preview

FoodFlow has four distinct product surfaces. Choose the [Admin](docs/admin-guide.md), [Restaurant](docs/restaurant-guide.md), [Customer](docs/customer-guide.md), or [Driver](docs/driver-guide.md) guide, then see the [full product gallery](docs/product-gallery.md) and [mobile overview](docs/customer-driver-guide.md). The manifest records source heads, runtimes, capture times, and privacy boundaries. Web media came from Google Chrome against the isolated local E2E stack; mobile media came from Flutter debug APKs on an Android API 35 x86_64 AVD. All are current local product/regression evidence from dirty working trees or local images—not production or release certification.

| Surface    | Product runtime                  | Current visual evidence                  | How to review the product                                                                                 |
| ---------- | -------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Admin      | Next.js web dashboard            | 10 local PNGs and one GIF                | Read the [Admin guide](docs/admin-guide.md), then run the Admin web app.                                  |
| Restaurant | Next.js web dashboard            | 10 local PNGs and one GIF                | Read the [Restaurant guide](docs/restaurant-guide.md), then run the Restaurant web app.                  |
| Customer   | Flutter/Riverpod Android/iOS app | One privacy-reviewed local WebP          | Read the [Customer guide](docs/customer-guide.md), then launch `main_customer.dart` on a device/emulator. |
| Driver     | Flutter/Riverpod Android/iOS app | Six role/GPS WebPs, two tracking assets, and one GIF | Read the [Driver guide](docs/driver-guide.md), then launch `main_driver.dart`.                  |

The mobile captures use simulated GPS and the isolated local stack. Their manifest records a dirty workspace, so authentic release media still requires a clean-head device/emulator recapture from the chosen release candidate. The documentation deliberately does not relabel local media as production evidence.

<p align="center">
  <img src="docs/screenshots/admin/02-overview.png" alt="FoodFlow Admin overview" width="48%" />
  <img src="docs/screenshots/restaurant/04-menu.png" alt="FoodFlow Restaurant menu" width="48%" />
</p>

| Flow | Preview |
|---|---|
| Admin sign-in to overview | ![Admin sign-in flow](docs/media/gifs/admin-login-flow.gif) |
| Restaurant orders to menu | ![Restaurant navigation](docs/media/gifs/restaurant-orders-to-menu.gif) |
| Customer app launch | ![Customer app launch](docs/screenshots/customer/01-login.webp) |
| Driver sign-in → Home → earnings → profile | ![Driver role flow](docs/media/gifs/driver-role-flow.gif) |

## Applications

| Surface     | Source                                                | Runtime                                          | Local target                                  | Primary guide                                              |
| ----------- | ----------------------------------------------------- | ------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| Backend API | `backend/`                                            | NestJS 11, Prisma 6                              | `http://localhost:3001/api`                   | —                                                          |
| Admin       | `web/apps/admin/`                                     | Next.js 15, React 18, next-intl                  | `http://localhost:3000`                       | [Admin guide](docs/admin-guide.md)                         |
| Restaurant  | `web/apps/restaurant/`                                | Next.js 15, React 18, next-intl                  | `http://localhost:3002`                       | [Restaurant guide](docs/restaurant-guide.md)               |
| Customer    | [`main_customer.dart`](mobile/lib/main_customer.dart) | Flutter/Riverpod native mobile app (Android/iOS) | device or emulator; Android `customer` flavor | [Customer guide](docs/customer-guide.md)                   |
| Driver      | [`main_driver.dart`](mobile/lib/main_driver.dart)     | Flutter/Riverpod native mobile app (Android/iOS) | device or emulator; Android `driver` flavor   | [Driver guide](docs/driver-guide.md)                       |

Admin and Restaurant routes are locale-prefixed for `vi`, `en`, and `ja`. The API uses a shared success envelope (`{ success: true, data, meta? }`) and RFC 7807 Problem Details for errors.

Customer and Driver have no local web URLs. Use their explicit Flutter entrypoints; the `--flavor` commands below select the Android product flavors.

## Capabilities

- Customer ordering, carts, addresses, vouchers, wallet/COD/SePay, reviews, support, and AI assistance.
- Driver online state, dispatch offers, fresh GPS validation, route guidance, ETA, heatmaps, earnings, KYC, and incentives.
- Restaurant order kanban, menu/options, promotions, revenue, reviews, notifications, staff, opening hours, and insights.
- Admin KPIs, orders, restaurants, users, drivers, live maps, promotions, audit, support, export, and AI telemetry.
- Tenant-scoped authorization for restaurant staff, realtime channels, tracking, exports, and administrative resources.
- Keyless MapLibre/OpenFreeMap basemaps plus backend Google Directions/owned OSRM routing when configured; route snapshots and telemetry fail closed instead of inventing coordinates, polylines, or ETA.
- DeepSeek-backed support through the backend adapter, with fail-closed configuration/provider errors, persisted usage telemetry, and no embedded provider key.

Google Maps is not required to boot FoodFlow. When neither Google Directions nor an owned OSRM service is configured, route calculation returns `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED`; the API and worker remain healthy. Railway currently runs with `RAG_ENABLED=false` because no DeepSeek credential is configured.

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

| Concern  | Managed production                 | Local/self-hosted compatibility |
| -------- | ---------------------------------- | ------------------------------- |
| Database | Supabase PostgreSQL/PostGIS        | PostGIS container               |
| Realtime | `REALTIME_PROVIDER=supabase`       | `socketio`                      |
| Storage  | `STORAGE_PROVIDER=supabase`        | `minio`                         |
| Queue    | `QUEUE_PROVIDER=supabase-postgres` | `bullmq`                        |

Admin, Restaurant, Customer, and Driver clients obtain short-lived, tenant-scoped realtime credentials from `POST /api/realtime/token` in managed mode. Mobile publishes GPS and dispatch decisions through authenticated REST and receives only allow-listed private Supabase Broadcast events; Socket.IO remains an explicit local/self-hosted compatibility provider.

## Docker packages

The table below records the matching multi-architecture Docker Hub and public GHCR manifests produced by the SHA-only workflow for runtime candidate `f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b`. Both registries were queried after publication. Docker Publish run `29387565225` pulled and smoke-tested both supported architectures and passed all eight High/Critical scans. Railway API/worker run the exact backend digest and the one-off migrator ran the exact migrate digest. `latest` remains unchanged until the remaining production certification gates pass.

| Artifact       | SHA tag                                                                                                                                        | Matching remote digest                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| API + worker   | [`nguyenson1710/foodflow-backend:sha-f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b`](https://hub.docker.com/r/nguyenson1710/foodflow-backend)       | `sha256:4c00f02f6d5ed64cfac4507eb18d50c39166159941a772ead725740448d6bebd` |
| Prisma migrate | [`nguyenson1710/foodflow-migrate:sha-f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b`](https://hub.docker.com/r/nguyenson1710/foodflow-migrate)       | `sha256:8e97a9adca15fe418288f83f43056310ab36c8b72ed7636a53a15c2950dda12a` |
| Admin          | [`nguyenson1710/foodflow-admin:sha-f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b`](https://hub.docker.com/r/nguyenson1710/foodflow-admin)           | `sha256:6f4757635d983ecf74a784749ca4aa4222066f68928a6c88e5deb0da9bf09744` |
| Restaurant     | [`nguyenson1710/foodflow-restaurant:sha-f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b`](https://hub.docker.com/r/nguyenson1710/foodflow-restaurant) | `sha256:272ce1e2b56ac85078ccea008effdffad4e84f82ec1816026a9ae53559923753` |

The worker runs from the backend image with `dist/workers/main.js`; it is not a separately maintained release artifact. All four GHCR packages are public, linked to `JasonTM17/FoodDelivery_App`, and grant the repository Actions write access. Docker Hub and GHCR digests match for every SHA tag. No semver or `latest` tag was promoted.

Release promotion order:

1. Build and push `sha-<full-commit>`.
2. Pull that SHA in a clean environment; run compose smoke and block High/Critical image findings. Completed for `f2c02ed` by run `29387565225`.
3. Pass Supabase/Railway/Vercel production health and authenticated tracking smoke. Provider health and controlled GPS Broadcast/PostGIS smoke passed; the wider device/browser matrix remains open.
4. Build and scan every supported architecture, then create immutable `v4.0.0`.
5. Promote `latest` only through an explicit manual release action.

For self-hosting, pin `IMAGE_TAG=v4.0.0` or `sha-<full-commit>` and use the base Compose file plus `docker-compose.prod.yml`. Never deploy an unverified `latest` tag.

## Repository layout

| Path       | Purpose                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `backend/` | API, Prisma schema/migrations, Vercel handler, worker entry             |
| `web/`     | pnpm workspace: Admin, Restaurant, shared packages, Playwright          |
| `mobile/`  | Flutter customer and driver entry points plus shared API client         |
| `infra/`   | Compose overlays, preflight, security, and release tooling              |
| `docs/`    | Architecture, API/OpenAPI, deployment, testing, security, product media |
| `e2e/`     | Cross-surface and AI smoke scenarios                                    |

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
flutter run --flavor customer -t lib/main_customer.dart
flutter run --flavor driver -t lib/main_driver.dart
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

The 2026-07-14 clean-volume Docker project `foodflow-batch4-e2e` applied all 38 migrations, seeded 201 users, 50 restaurants, 352 menu items, 509 orders, and 123 reviews, then indexed 402 RAG documents. A transaction check rejected a second default address for the same user. With explicit E2E URLs, the current rebuilt stack passed all 68 cases in Chrome desktop (173.0 s), Firefox (172.9 s), and Pixel 5 mobile Chrome (117.3 s): 204/204 total. `flutter analyze` remained clean and the full Customer/Driver suite passed 367 tests. Direct Chrome review also found the public Admin and Restaurant sign-in forms usable at desktop and Pixel 5 widths, with no console errors or horizontal overflow. None of this local evidence validates remote provider state, a deployed image, or live Firebase delivery.

## Deployment order

1. Rotate exposed credentials and keep all configured Railway/provider values in sealed provider stores.
2. Recheck all 41 effective production migrations and reconcile the three historical checksum mismatches before rollout; never bypass a failing guard or infer provider state from local Docker.
3. Preserve the verified Railway API/worker deployments, then deploy future releases from one immutable SHA and recheck health/readiness/worker polling.
4. Run authenticated Supabase private-Broadcast allow/deny, token refresh, Storage, GPS snapshot/delta, reconnect, and tenant-isolation smoke through the live API.
5. Re-smoke the exact Admin and Restaurant Vercel deployments against the current Railway API, then smoke configured maps/routes, chatbot, notifications, exports, payments, and one controlled-device FCM delivery.
6. Preserve the verified `f2c02ed` Docker Hub/GHCR manifests and scans; promote semver/`latest` only after the remaining device/browser/provider production gates pass.

## Documentation

- [Admin guide](docs/admin-guide.md) — platform operations, support, reports, exports, and settings
- [Restaurant guide](docs/restaurant-guide.md) — orders, menu, staff permissions, revenue, and settings
- [Customer guide](docs/customer-guide.md) — ordering, permissions, map-based address selection, checkout, tracking, and support
- [Driver guide](docs/driver-guide.md) — onboarding, Online/GPS, dispatch, earnings, and profile
- [Product gallery](docs/product-gallery.md)
- [Customer and Driver mobile guide](docs/customer-driver-guide.md)
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

At the 2026-07-14 check, the remote advertised only `origin/master`; the retained linked worktree ref is already an ancestor of `master`, not pending work. Do not merge, recreate, push, or delete local worktree refs without explicit direction. Local branch ancestry and local tests are not production approval; see the evidence-backed [branch disposition](docs/branch-disposition.md).

## License

[MIT](LICENSE)
