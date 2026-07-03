# FoodFlow - Realtime Food Delivery Platform

Documentation languages: [English](README.md) | [Tiếng Việt](docs/readme.vi.md) | [日本語](docs/readme.ja.md)

<p align="center">
  <img src="https://img.shields.io/badge/backend-NestJS-ea2845?logo=nestjs" alt="Backend">
  <img src="https://img.shields.io/badge/mobile-Flutter-02569B?logo=flutter" alt="Mobile">
  <img src="https://img.shields.io/badge/web-Next.js-black?logo=next.js" alt="Web">
  <img src="https://img.shields.io/badge/db-PostgreSQL%2BPostGIS-336791?logo=postgresql" alt="Database">
  <img src="https://img.shields.io/badge/realtime-Socket.IO-010101?logo=socket.io" alt="Realtime">
  <img src="https://img.shields.io/badge/ai-LLM%20Chatbot-18e46a" alt="AI">
  <img src="https://img.shields.io/github/license/JasonTM17/foodflow" alt="License">
</p>

FoodFlow is a multi-client food delivery platform with a NestJS backend, Next.js Admin and Restaurant dashboards, Flutter mobile apps, PostgreSQL/PostGIS, Redis realtime primitives, Socket.IO, SePay payments, Google/OSRM routing, and an AI support assistant.

FoodFlow does not use an external workflow automation runner in runtime. AI chat and food recommendations run through the backend LLM adapter, with explicit degraded responses when the model provider is unavailable.

## Applications

| Surface | Path | Runtime | Default URL |
|---|---|---|---|
| Backend API | `backend/` | NestJS, Prisma, Socket.IO | `http://localhost:3001/api` |
| Admin dashboard | `web/apps/admin/` | Next.js 14, React 18, next-intl | `http://localhost:3000` |
| Restaurant dashboard | `web/apps/restaurant/` | Next.js 14, React 18, next-intl | `http://localhost:3002` |
| Customer and driver apps | `mobile/` | Flutter | Device/emulator |
| Infrastructure | `infra/`, `docker-compose*.yml` | PostgreSQL/PostGIS, Redis, MinIO | Local containers |

## Core Capabilities

- Customer ordering, wallet/COD/SePay payments, realtime delivery tracking, AI support.
- Driver availability, location updates, dispatch, route guidance, earnings.
- Restaurant order kanban, menu/categories/options, reviews, revenue, promotions, staff and insights.
- Admin KPI dashboard, live driver map, restaurants/users/orders/promotions/support/audit/export management.
- Web contract: successful web responses use `{ success: true, data, meta? }`; errors use RFC 7807 Problem Details.
- Locale strategy: Admin and Restaurant web routes live under `/:locale` with `vi`, `en`, and `ja`.

## Architecture

```text
Flutter apps         Next.js dashboards          NestJS backend
customer/driver  ->  admin/restaurant   ->  REST + WebSocket + queues
                                             |
                                             v
                         PostgreSQL/PostGIS + Redis + MinIO
```

Realtime flows use Socket.IO and Redis. Maps use Google Maps when configured and OSRM as the backend routing fallback. AI chat is LLM-first through the backend provider adapter and returns an explicit degraded state when no model key is configured.

## Prerequisites

- Node.js 20+ or 22+ compatible with the checked-in lockfiles
- pnpm 10
- Docker Desktop or Docker Engine
- Flutter SDK for mobile work
- Google Maps, SePay, DeepSeek, Supabase, and Vercel credentials only when enabling those integrations

## Quick Start: local development

Use ignored `.env` files for real secrets. Never put production keys in committed files.

```bash
# 1. Start shared services for host-run development
docker compose up -d postgres redis minio

# 2. Backend
cd backend
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
pnpm start:dev

# 3. Web dashboards
cd ../web
pnpm install --frozen-lockfile
pnpm dev

# 4. Mobile
cd ../mobile
flutter pub get
flutter run -t lib/main_customer.dart
flutter run -t lib/main_driver.dart
```

Useful local URLs:

| Service | URL |
|---|---|
| Backend API | `http://localhost:3001/api` |
| Backend health | `http://localhost:3001/api/healthz` |
| Admin web | `http://localhost:3000` |
| Restaurant web | `http://localhost:3002` |
| MinIO console | `http://localhost:9001` |

## Docker Compose

Run the full stack locally:

```bash
docker compose up -d --build
```

Production-style compose uses `docker-compose.prod.yml`. Do not deploy the development defaults as-is; override all secrets, passwords, CORS origins, public URLs, and provider keys in the target secret store.

## Environment and secrets

Start from:

- Root: `.env.example`
- Backend: `backend/.env.example`
- Admin web: `web/apps/admin/.env.example`
- Restaurant web: `web/apps/restaurant/.env.example`

Important production rules:

- Rotate any key pasted into chat, logs, screenshots, tickets, or git history.
- Keep `DATABASE_URL`, `DIRECT_URL`, `DEEPSEEK_API_KEY`, `SEPAY_API_KEY`, `SEPAY_WEBHOOK_SECRET`, JWT secrets, database passwords, Vercel tokens, and Supabase service keys only in secret managers or ignored local env files.
- Restrict browser-exposed Google Maps keys by HTTP referrer.
- Keep backend Google Maps keys server-only.
- SePay intents require both `SEPAY_API_KEY` and `SEPAY_ACCOUNT_NUMBER`; incomplete provider responses are rejected.

## Test Gates

Run narrow checks first, then broaden:

```bash
# Backend
cd backend
pnpm prisma validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# Web monorepo
cd ../web
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox

# Mobile
cd ../mobile
flutter test
flutter analyze
```

Batch 4 is not complete until backend, web, Playwright Chromium/Firefox, axe serious/critical, visual regression, tenant isolation, frozen install, and secret scans are all green.

## Deployment Path

Deployment is intentionally gated:

1. Merge tested Batch 4 integration through a PR.
2. Provision Supabase database/realtime only with rotated production secrets; backend Prisma uses pooled `DATABASE_URL` at runtime and direct/session `DIRECT_URL` for migrations.
3. Deploy Admin and Restaurant to Vercel after web builds and E2E pass.
4. Deploy backend with health checks, migrations, Redis, MinIO/storage, SePay webhook secrets, and CORS locked to production domains.
5. Verify production health, realtime orders, maps, chatbot, exports, notifications, and tenant isolation.
6. Enable keep-alive or external monitors only after health endpoints are stable.

No deploy should happen from a dirty worktree or with unverified secrets.

## Documentation

- [API contract](docs/api-contract.md)
- [API reference](docs/api-reference.md)
- [Architecture](docs/system-architecture.md)
- [Deployment guide](docs/deployment-guide.md)
- [Testing guide](docs/testing-guide.md)
- [AI chatbot guide](docs/ai-chatbot-guide.md)
- [Security audit guide](docs/security-audit-guide.md)
- [Documentation localization policy](docs/documentation-localization.md)
- [Code standards](docs/code-standards.md)
- [Design guidelines](docs/design-guidelines.md) ([VI](docs/design-guidelines.vi.md), [JA](docs/design-guidelines.ja.md))
- [i18n guide](docs/i18n-guide.md)
- [Roadmap](docs/project-roadmap.md)

## Branch and integration policy

- Use `codex/batch4-integration` as the clean integration branch.
- Do not raw-merge stale team branches that pull old routes, mock data, wrong package managers, or mobile-generated clients into Batch 4.
- Salvage branch work hunk-by-hunk with focused tests and small conventional commits.
- Keep mobile reconciliation separate until web/backend Batch 4 is stable.
- Do not delete local or remote branches until backups and branch disposition are verified.

## License

MIT (see [LICENSE](LICENSE)).
