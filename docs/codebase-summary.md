# FoodFlow Codebase Summary

A quick orientation for new contributors.

## Repository Layout

```
Food_Delivery/
├── backend/          NestJS API (modular monolith)
├── mobile/           Flutter apps — customer + driver (shared workspace)
├── web/              Next.js apps — admin + restaurant
│   └── apps/
│       ├── admin/    Admin dashboard
│       └── restaurant/ Restaurant portal
├── infra/            Docker Compose, n8n workflows, nginx config
├── packages/
│   └── i18n/         Shared web translation messages (@foodflow/i18n)
├── docs/             Project docs and ADRs
└── plans/            Implementation plans (not committed to public repo)
```

## Backend (NestJS)

Modular monolith. One process, one Docker image, logically separated by feature module.

| Module | Responsibility |
|---|---|
| `auth` | JWT issue/refresh, RBAC guards, API-key guard |
| `users` | Profile CRUD, preferredLocale persistence |
| `restaurants` | Restaurant CRUD, nearby search (PostGIS), profile images |
| `menu` | Menu items, categories, option groups |
| `cart` | Shopping cart sessions |
| `orders` | Order state machine (14 states), payments service |
| `dispatch` | Driver assignment — Redis GEO scoring, BullMQ retry |
| `tracking` | WebSocket gateway for real-time GPS |
| `payments` | SePay provider, commission split, PayoutLedger |
| `webhooks` | Inbound SePay payment-success webhook |
| `loyalty` | Loyalty transaction ledger, points snapshot (GET /users/loyalty) |
| `wallet` | Wallet transaction ledger, balance snapshot (GET /users/wallet) |
| `referral` | Referral code generation + redemption tracking (GET /users/referral) |
| `reviews` | Aggregation, moderation, photo upload, reply thread |
| `notifications` | FCM/WebSocket fan-out, locale-aware templates |
| `chat` | WebSocket chat between customer and support |
| `ai` | n8n webhook bridge, chat classify, AI templates |
| `i18n` | nestjs-i18n module, vi/en/ja locale files |
| `admin` | Admin REST endpoints, audit logs, promotions, dispatch heatmap, restaurant KPI |
| `drivers` | Driver profiles, location history, KYC, IncentivesController (GET /driver/incentives) |
| `storage` | MinIO presigned URL service |
| `metrics` | Prometheus `/metrics` endpoint |
| `health` | `/healthz` + `/readyz` endpoints |
| `redis` | Shared Redis module (GEO + PubSub) |
| `database` | Prisma service singleton |

Entry point: `backend/src/main.ts` (HTTP) and `backend/src/workers/main.ts` (BullMQ worker process).

## Mobile (Flutter)

Single Dart workspace, two apps under `mobile/apps/`:

| App | Users | Key screens |
|---|---|---|
| `customer` | End consumers | Home, search, cart, order tracking, chat, reviews |
| `driver` | Delivery drivers | Online toggle, dispatch offer dialog, active delivery, earnings, KYC |

Shared code in `mobile/packages/`:
- `api_client` — Dio-based HTTP + WebSocket singletons
- `shared_ui` — reusable widgets, locale switcher

State management: **Riverpod**. Localization: `flutter_localizations` + ARB files (vi/en/ja).

## Web (Next.js App Router)

| App | Users | Key pages |
|---|---|---|
| `admin` | Platform admins | Dashboard, orders, restaurants, users, drivers, promotions, audit logs, AI monitor |
| `restaurant` | Restaurant owners | Menu, orders, reviews, notifications, profile |

Both apps use:
- `shadcn/ui` component library
- TanStack Query for server state
- `next-intl` for vi/en/ja routing (`/[locale]/...`)
- `PageHeader` shared component for breadcrumb + gradient title

## Infrastructure

| Service | Image | Purpose |
|---|---|---|
| `api` | `nguyenson1710/foodflow-api` | NestJS HTTP server |
| `worker` | `nguyenson1710/foodflow-worker` | BullMQ job processors |
| `postgres` | `postgis/postgis:16-3.4` | Primary database + GIS |
| `redis` | `redis:7-alpine` | GEO, PubSub, BullMQ broker |
| `minio` | `minio/minio` | Object storage |
| `n8n` | `n8nio/n8n` | Workflow automation + AI |
| `prometheus` | `prom/prometheus` | Metrics scraping |
| `grafana` | `grafana/grafana` | Dashboards |
| `loki` | `grafana/loki` | Log aggregation |

Start everything: `docker compose up`.

## Key Data Flows

**Order placement:** Customer app → `POST /orders` → order state machine → dispatch BullMQ job → driver offered via WebSocket → accepted → delivery task created.

**Real-time tracking:** Driver app emits GPS every 3 s → WebSocket → Redis GEOADD → throttled broadcast to customer → batch flush to `driver_location_history`.

**Payment success:** SePay → `POST /webhooks/sepay` (HMAC verified) → BullMQ job → commission split → PayoutLedger entries → notification to restaurant + driver.

**i18n propagation:** Accept-Language header → i18n middleware → `req.i18nLang` → used in response messages; async jobs carry `locale` in job data explicitly.

## Where to Start

- Bug in an order flow → `backend/src/orders/`
- Driver not receiving dispatch → `backend/src/dispatch/`
- Translation missing → `backend/src/i18n/locales/<lang>/` or `packages/i18n/messages/`
- Admin page broken → `web/apps/admin/app/[locale]/`
- Mobile UI issue → `mobile/apps/customer/` or `mobile/apps/driver/`
