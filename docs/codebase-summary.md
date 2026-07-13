# FoodFlow Codebase Summary

## Overview

FoodFlow is a TypeScript/Dart monorepo-style repository. Backend and web have independent pnpm lockfiles/workspaces; mobile is a Flutter package with customer and driver entry points. Documentation, OpenAPI, Compose overlays, and release tooling live alongside the applications.

Current tracked text-code footprint (excluding generated/test-output directories): approximately 62.7k LOC web, 50.8k LOC mobile, 50.4k LOC backend, 11.8k LOC docs, and 2.8k LOC infrastructure.

## Repository layout

```text
backend/                   NestJS API, Prisma, Railway entry, compatibility adapter, worker entry
  api/[...path].ts         Retained compatibility HTTP adapter; managed production API runs on Railway
  prisma/                  Schema, 32 tracked migrations at the 2026-07-13 `master` baseline
  src/                     Feature modules
web/                       pnpm workspace
  apps/admin/              Admin Next.js application
  apps/restaurant/         Restaurant Next.js application
  packages/                Shared UI/i18n/client utilities
  e2e/                     Playwright Chromium/Firefox contracts
mobile/                    Flutter package
  lib/main_customer.dart   Customer entry
  lib/main_driver.dart     Driver entry
  packages/api_client/     Shared typed HTTP models/client
  test/                    Widget/provider/contract tests
infra/                     Compose, preflight, release, monitoring, load tests
docs/                      Guides, ADRs, OpenAPI, screenshots, GIFs
e2e/                       Cross-surface/AI scenario tooling
.github/workflows/         CI, security, E2E, mobile, OpenAPI, Docker release
```

## Backend

Runtime: NestJS 11, Prisma 6, PostgreSQL/PostGIS. Main entries:

- `src/main.ts`: local/self-hosted HTTP process; disables long-lived sockets for Supabase realtime mode.
- `src/bootstrap/create-foodflow-app.ts`: reusable application factory.
- `api/[...path].ts`: retained compatibility handler; not the managed-production API target.
- `src/workers/main.ts`: BullMQ compatibility worker.

Major module groups:

| Module | Responsibility |
|---|---|
| `auth`, `users` | Access/refresh JWT, RBAC, profile/preferred locale |
| `restaurants`, `restaurant-portal`, `menu` | Tenant profile, nearby search, menu, staff, analytics |
| `cart`, `orders`, `payments`, `promotions` | Checkout, order state, SePay/COD/wallet, voucher rules |
| `drivers`, `dispatch`, `tracking` | Online GPS, assignment, route/ETA, live telemetry |
| `notifications`, `webhooks` | Locale-aware fanout and authenticated callbacks |
| `reviews`, `storage` | Reviews and provider-selected object storage |
| `ai` | DeepSeek chat, session ownership, support escalation, usage telemetry |
| `admin` | KPI/resources, audit, support, exports, AI monitor |
| `realtime` | Supabase outbox publisher and scoped token endpoint |
| `common/queue` | BullMQ or PostgreSQL job-outbox abstraction |
| `health`, `metrics` | Health/readiness and Prometheus-compatible metrics |

The Prisma schema at the 2026-07-13 `master` baseline declares 58 models across 32 tracked ordered migrations. PostGIS geometry is used for addresses, restaurants, delivery tasks, and location history; the tracked RAG migration adds pgvector-backed storage and a cosine HNSW index. Its committed checksum matches the migration applied to Supabase. `realtime_outbox`, `job_outbox`, durable payment webhook/refund records, `dispatch_offers`, private driver KYC submissions, and `ai_usage_events` support the managed-production topology.

Notifications are persisted and fanned out by channel. Push delivery uses Firebase Admin SDK/FCM HTTP v1 (`FCM_PROJECT_ID` plus ADC/workload identity or sealed `FCM_SERVICE_ACCOUNT_JSON`); provider-request failures are retryable and permanently invalid tokens are marked stale.

## Web

Both applications use Next.js 15 App Router, React 18, TypeScript, Tailwind, TanStack Query, and `next-intl`.

| App | Primary users | Major areas |
|---|---|---|
| Admin | Platform operators | overview, orders, restaurants, users, drivers/map, promotions, support, analytics, audit, exports, AI monitor |
| Restaurant | Owners/staff | dashboard, order queue/tracking, menu, promotions, analytics, staff, revenue, reviews, notifications, settings |

Important contracts:

- Routes start at `app/[locale]/` for `vi`, `en`, and `ja`.
- Production public env validation is fail-closed.
- API responses are validated at runtime before rendering business data.
- `src/lib/supabase-realtime.ts` exchanges the API access token for scoped Supabase realtime authorization.
- Socket.IO modules remain only for local/self-hosted provider mode.
- Production builds generate 70 localized Admin pages and 55 localized Restaurant pages at the current route set.

## Mobile

The Flutter package has two app entry points but shares domain/provider/UI code under `mobile/lib/`.

- State: Riverpod.
- HTTP: Dio through `mobile/packages/api_client` and shared providers.
- Maps/location: `google_maps_flutter` + `geolocator`.
- Localization: generated ARB resources for `vi`, `en`, `ja`.
- Secrets: Maps key and release signing are injected through ignored platform config/`--dart-define` inputs.

Managed mobile realtime uses the same scoped `POST /api/realtime/token` + Supabase channel contract as web. `RealtimeClient` selects `SupabaseRealtimeClient` in managed release builds; GPS samples and dispatch decisions use authenticated REST while allow-listed outbox records are receive-only. `socket_io_client` remains installed solely for the explicit local/self-hosted provider. Driver KYC uses private signed uploads, opaque object keys, authenticated status checks, and a typed terms → vehicle → documents flow.

## Infrastructure and release tooling

| Path | Purpose |
|---|---|
| `docker-compose.yml` | Local full stack |
| `docker-compose.local.yml` | Hot-reload/local overrides |
| `docker-compose.e2e.yml` | Isolated test ports and deterministic stack |
| `docker-compose.prod.yml` | Self-hosted Docker Hub compatibility overlay |
| `infra/scripts/local-release-gate.ps1` | Unified local quality gate |
| `infra/scripts/supabase-preflight.ps1` | Auth/project/database migration readiness |
| `infra/scripts/vercel-web-preflight.ps1` | Admin/Restaurant Vercel project/env readiness; the API, worker, migrator, and Redis run on Railway |
| `.github/workflows/docker-publish.yml` | Multi-arch SHA build, runtime smoke, Trivy, immutable promotion |

Docker publishes four artifacts: backend, migrate, Admin, and Restaurant. The worker reuses the backend artifact.

## Key data flows

**Order:** customer cart → `POST /orders` → persisted state/history → restaurant transitions → dispatch → delivery task → payment/notification.

**Tracking:** driver GPS with `sampledAt` → authorization/freshness/bounds validation → route provider/cache → PostGIS/delivery task → authorized snapshot and realtime channel.

**Supabase realtime:** API event → `realtime_outbox` row → explicit Supabase publication → RLS filter against short-lived JWT channel claims → Admin/Restaurant/Customer/Driver handler.

**Queue:** service adds abstract job → PostgreSQL `job_outbox` in managed mode or BullMQ locally → secured drain/worker → status/attempt/error persisted.

**AI:** authenticated message → session/order context validation → DeepSeek adapter → persisted turn and usage event → answer or support escalation; missing configuration/provider failures return explicit errors and never synthesize an assistant reply.

## Contributor entry points

- API contract: `docs/openapi.yaml`, `docs/api-contract.md`.
- Environment validation: `backend/src/config/env.validation.ts` and each `.env.example`.
- Restaurant tenancy: `backend/src/restaurant-portal/` and `RestaurantProfile` checks.
- Realtime: `backend/src/realtime/`, web `src/lib/supabase-realtime.ts`.
- Shipper route: `backend/src/tracking/`, `backend/src/dispatch/`, mobile tracking/driver providers.
- UI localization: `web/apps/*/messages/` or shared i18n package; Flutter ARB under `mobile/lib/l10n/`.
- Full release commands: [testing guide](testing-guide.md) and [deployment guide](deployment-guide.md).
