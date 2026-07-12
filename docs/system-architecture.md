# FoodFlow System Architecture

## Overview

FoodFlow is a modular-monolith delivery platform with five user-facing surfaces: the NestJS API, Admin web, Restaurant web, Customer Flutter app, and Driver Flutter app. The managed-production target is Supabase + Railway + Vercel; Docker Compose is an explicit local/self-hosted compatibility topology rather than the production source of truth.

Current schema includes ordered Prisma migrations for PostGIS delivery geometry, private Broadcast authorization, job/dispatch outboxes, private driver KYC, audit/export records, and AI usage telemetry.

## Managed-production topology

```mermaid
flowchart TB
    Customer["Customer Flutter"]
    Driver["Driver Flutter"]
    Admin["Admin Next.js 15"]
    Restaurant["Restaurant Next.js 15"]
    API["NestJS 11 API\nRailway"]
    Worker["Postgres outbox worker\nRailway"]
    Redis["Managed Redis\nRailway"]
    DB[("Supabase PostgreSQL\n+ PostGIS")]
    Realtime["Supabase Realtime\nprivate Broadcast"]
    Storage["Supabase Storage\nscoped bucket policies"]
    Basemap["MapLibre + OpenFreeMap\nkeyless web basemap"]
    Routing["Google Directions / owned OSRM\nbackend route provider"]
    AI["DeepSeek API\ndeepseek-v4-flash"]
    Integrations["SePay · SMTP · FCM · Twilio"]

    Customer -->|HTTPS REST| API
    Driver -->|HTTPS REST + GPS samples| API
    Admin -->|HTTPS REST| API
    Restaurant -->|HTTPS REST| API
    Admin --> Basemap
    Restaurant --> Basemap
    API --> DB
    Worker --> DB
    API --> Redis
    Worker --> Redis
    API --> Storage
    API --> Routing
    API --> AI
    API --> Integrations
    API -->|private Broadcast| Realtime
    API -->|5-minute scoped JWT| Admin
    API -->|5-minute scoped JWT| Restaurant
    API -->|5-minute scoped JWT| Customer
    API -->|5-minute scoped JWT| Driver
    Realtime -->|authorized events| Admin
    Realtime -->|authorized events| Restaurant
    Realtime -->|authorized events| Customer
    Realtime -->|authorized events| Driver
```

The API can run without a long-lived WebSocket server when `REALTIME_PROVIDER=supabase`. Scheduled work is persisted in PostgreSQL and drained by the Railway worker when `QUEUE_PROVIDER=supabase-postgres`; the secured endpoint is retained for recovery and one-off operation.

## Local and self-hosted topology

```mermaid
flowchart LR
    Clients["Web + Flutter clients"] --> API["NestJS API"]
    API --> Postgres[("PostgreSQL/PostGIS")]
    API --> Redis[("Redis GEO/cache/pubsub")]
    API --> MinIO["MinIO"]
    API --> Sockets["Socket.IO namespaces"]
    Worker["Backend image\ndist/workers/main.js"] --> Redis
    Worker --> Postgres
```

This topology uses `REALTIME_PROVIDER=socketio`, `STORAGE_PROVIDER=minio`, and `QUEUE_PROVIDER=bullmq`. It is useful for development, E2E, and self-hosting, but its environment values must never be reused as managed-production defaults.

## HTTP and authentication boundaries

- Global REST prefix: `/api`.
- Success: `{ success: true, data, meta? }`.
- Failure: RFC 7807 Problem Details with a stable application `code`.
- Access and refresh JWTs are distinct; browser clients serialize refresh and block refresh loops.
- RBAC guards enforce `admin`, `restaurant`, `driver`, and `customer` boundaries.
- Restaurant access additionally requires an active `RestaurantProfile` for the target tenant.
- Tracking access is order-participant scoped: owner customer, assigned driver, active staff for the order restaurant, or admin.

See [API contract](api-contract.md) and [OpenAPI](openapi.yaml).

## Supabase Realtime contract

```mermaid
sequenceDiagram
    participant Client as Admin/Restaurant/Customer/Driver
    participant API as NestJS API
    participant DB as Supabase Postgres
    participant RT as Supabase Realtime

    Client->>API: POST /api/realtime/token {orderId?, restaurantId?}
    API->>DB: Verify user/order/restaurant ownership
    API-->>Client: ES256 JWT, expiresAt, allowed channels
    Client->>RT: setAuth(token) + subscribe to private channel
    API->>RT: Broadcast(channel,event,payload)
    RT-->>Client: Event only when realtime.messages policy allows channel claim
```

The JWT TTL is five minutes. Claims contain `sub`, application role, and `realtime_channels`. The private Broadcast policy on `realtime.messages` reads those claims and permits subscribe only to an explicitly allowed channel. `realtime_outbox` remains only for the one-cycle rollback path; broad public channels are not part of the design.

Canonical channel families cover user notifications, admin orders/drivers, restaurant tenants, drivers, orders, and restaurant-driver chat. A requested order or restaurant scope is rejected before token issue when ownership cannot be proven.

Admin, Restaurant, Customer, and Driver managed clients support this contract. Mobile GPS and dispatch decisions remain authenticated REST mutations; Supabase is receive-only for allow-listed business events. Socket.IO remains an explicit local/self-hosted transport.

## Queue and outbox processing

`QUEUE_PROVIDER=supabase-postgres` writes jobs to `job_outbox` with queue, name, JSON payload/options, status, attempts, and `run_at`. The Railway worker drains bounded batches immediately and then polls without overlapping a prior drain. `GET|POST /api/jobs/drain` are recovery/one-off server-to-server routes and require an exact `Authorization: Bearer ${CRON_SECRET}` value.

Local BullMQ remains available. The worker is another entry point in the backend image, not a separate package/image contract.

## Storage

- Managed production: Supabase Storage through the server-side secret-key client.
- Local/self-hosted: MinIO.
- Driver KYC and proof-of-delivery use the dedicated private `foodflow-private` bucket. The API issues owner-scoped signed uploads, validates stored MIME/signature/ownership, stores only object keys, and gives Admin five-minute signed reads. Public menu, restaurant, avatar, and review assets use `foodflow-public`.
- Public restaurant/menu assets remain separate from private KYC data.
- Restaurant assets are uploaded/deleted through backend authorization; service-role keys are never exposed to clients.
- Storage health follows the selected provider and reports a degraded component instead of silently substituting another provider.

## Maps, dispatch, and shipper tracking

```mermaid
sequenceDiagram
    participant Driver as Driver app
    participant API as Tracking/Dispatch API
    participant Route as Routing provider
    participant DB as PostgreSQL/PostGIS
    participant Client as Customer/Restaurant/Admin

    Driver->>API: GPS {lat,lng,sampledAt,orderId}
    API->>API: Validate bounds, freshness, role, order phase
    API->>Route: Route pickup/drop-off when needed
    Route-->>API: distance, duration, encoded geometry
    API->>DB: Persist phase-matched route + telemetry
    API-->>Client: Authorized snapshot/realtime event
```

Key invariants:

- Missing, stale, future, malformed, overflowing, or out-of-service-area coordinates are rejected.
- Route geometry is tied to pickup/drop-off phase; wrong-phase data cannot replace the visible route.
- ETA is derived from provider route/traffic data and remaining progress, not an invented speed fallback.
- Driver maps do not center on a hardcoded city when both GPS and valid backend geometry are absent.
- Redis GEO/cache is a local compatibility accelerator; persisted PostGIS/`delivery_tasks.route_geojson` remains the durable route source.

## AI support

The API owns all DeepSeek calls. `DEEPSEEK_MODEL` defaults to `deepseek-v4-flash`; the provider key is server-only. Chat sessions and turns are ownership-checked, usage events persist model/token/cost/latency telemetry, and Admin AI Monitor reads those persisted aggregates. Missing configuration and provider failures return explicit typed states; the system does not fabricate an LLM answer.

Any key previously pasted into chat or logs must be rotated before live smoke or production deploy.

## Tenant and data security

- Prisma queries scope restaurant resources by the authenticated active profile.
- Realtime channel authorization is verified before ES256 JWT signing and again through the private Supabase Broadcast policy on `realtime.messages`.
- Public job/telemetry tables enable RLS; the retained realtime outbox is rollback-only and is not a client broadcast source.
- Export jobs are tied to the requesting admin; unsupported Parquet creation is rejected rather than generating fake output.
- Webhooks require provider/generic secrets and replay protection.
- Production environment validation rejects missing keys, example values, local URLs, weak JWT/Cron secrets, and implicit provider fallbacks.

## Internationalization

| Layer | Mechanism | Locales |
|---|---|---|
| Backend | `nestjs-i18n`, request locale + persisted preference | `vi`, `en`, `ja` |
| Admin/Restaurant | URL segment + `next-intl` | `vi`, `en`, `ja` |
| Flutter | generated ARB localizations | `vi`, `en`, `ja` |
| Async jobs | locale serialized into job payload | `vi`, `en`, `ja` |

URL locale is authoritative for web rendering, metadata, `html lang`, labels, and accessibility text. Cookie/session state must not override a fresh locale URL.

## Operational health and release boundaries

- API: `/api/healthz` and `/api/readyz`.
- Admin/Restaurant: `/api/healthz`.
- Railway API health configuration is declared in `backend/railway.toml`; the Railway worker owns recurring job-outbox draining.
- Docker release images are multi-architecture, non-root, digest-promoted, and scanned before semver/latest promotion.
- Supabase/Railway/Vercel deploy is blocked until their preflight scripts pass and current-head local plus remote gates are green.

Related decisions: [ADR index](adr/0001-record-architecture-decisions.md), [deployment guide](deployment-guide.md), and [testing guide](testing-guide.md).
