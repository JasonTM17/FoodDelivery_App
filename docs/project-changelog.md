# Changelog

All notable changes to FoodFlow are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added (Batch 3 — Stitch Finalize + Production Hardening)
- Customer profile menu wired to loyalty/wallet/referral/help screens
- Driver support contact buttons wired to `url_launcher` (tel/mailto/https)
- Restaurant sidebar navigation extended with Promotions + Analytics links
- `/[locale]/promotions` list page on restaurant app with i18n keys × 3 locales
- `/[locale]/promotions/[id]` read-only detail page (clickable rows from list)
- `/[locale]/promotions/[id]/edit` edit page (active/description/endDate fields)
- Backend `LoyaltyModule` — `GET /users/loyalty` returns points + tier + transactions
- Backend `WalletModule` — `GET /users/wallet` returns balance + transactions
- Backend `ReferralModule` — `GET /users/referral` returns code + invitees + rewards
- Backend `DriverIncentivesController` — `GET /driver/incentives` (stub data)
- Admin endpoints `GET /admin/dispatch/heatmap` + `GET /admin/restaurants/:id/kpi` (stub data)
- Prisma `LoyaltyTransaction` model + `LoyaltyTxnType` enum
- Admin overview heatmap widget consuming `/admin/dispatch/heatmap` (auto-refresh 30s)
- Admin restaurant detail KPI card consuming `/admin/restaurants/:id/kpi` (7-day stats)

### Changed
- `@foodflow/ui` package: added `next` as peer + dev dependency for breadcrumb component (fixes admin typecheck)

### Deferred to v0.3
- JWT Ed25519 cutover phase 1 (dual verify) — security-critical, requires red-team review
- Backend stub APIs (loyalty/wallet/referral/incentives + admin heatmap/KPI)
- Admin web gaps (overview heatmap widget, restaurant detail KPIs)
- Promotion edit page + detail page
- Test init fixes (dayjs ESM/CJS interop, BullMQ DI mock)
- 8 dependabot major bumps (TypeScript 6, Prisma 7, zod 4, node 26, tailwind 4, day-picker 10, lucide-react 1, @hookform/resolvers 5) tracked in issues #35-42

## [0.2.0] — 2026-06-07

### Added

**Internationalisation (i18n)**
- `nestjs-i18n` module with vi/en/ja locales: errors, notifications, ai_templates, constants namespaces
- `User.preferredLocale` field — `LocaleCode` enum (`vi | en | ja`), default `vi`
- Accept-Language → cookie → `User.preferredLocale` resolution chain
- Locale threaded into BullMQ notification fanout jobs via explicit `job.data.locale`
- `fallbackT` utility for offline-safe translation outside request context
- Flutter `flutter_localizations` with ARB files for vi/en/ja on customer + driver apps
- Locale provider + locale switcher widget (Flutter)
- `next-intl` routing with `[locale]` URL segments on admin and restaurant web apps
- `LocaleSwitcher` component in both Next.js apps
- `@foodflow/i18n` shared messages package for admin + restaurant translations

**Payments**
- SePay provider with HMAC-SHA256 webhook signature verification
- `PaymentIntent` + `PayoutLedger` + commission snapshot Prisma models
- Commission-split BullMQ processor: platform 15 %, restaurant 70 %, driver 15 %
- Refund processor with idempotency guard
- SePay payment-success webhook route wired to `PaymentsModule`

**Reviews**
- Review aggregation pipeline (avg rating, count rollup on restaurant)
- Review moderation queue (admin approve / reject)
- Photo upload per review (MinIO presigned URL flow)
- Reply thread on reviews (restaurant reply)

**Dispatch**
- BullMQ-backed dispatch scoring processor
- Dispatch metrics instrumentation (Prometheus counters)

**Admin**
- Audit logs page: full-text filter, date range, role filter, CSV export, pagination
- Vocabulary sweep across overview/orders/restaurants/users/promotions/support/settings/analytics/drivers/ai-monitor

**Mobile (Driver)**
- Real GPS online/offline toggle wired to backend state
- Dispatch offer dialog with accept/decline + 30 s countdown
- KYC document upload service using MinIO presigned URLs

**Restaurant Web**
- Reviews and notifications wired to real API
- Restaurant profile image upload

**UI / Web**
- Shared `PageHeader` component (breadcrumb + gradient H1) — applied across all admin pages

**CI / Quality**
- Integration smoke gate workflow (4 parallel jobs: auth, orders, dispatch, AI)
- E2E smoke-runner orchestrator (bash + PowerShell scripts)
- AI scenario smoke gate (5 canonical conversations)
- Lighthouse CI config — perf ≥ 80, a11y ≥ 90, bundle ≤ 200 KB gzip
- k6 mixed load test — 100 RPS × 5 min, p95 < 500 ms target
- Backend: dispatch metrics, dispatch processor, SePay provider unit tests

### Changed

- Admin pages: inline breadcrumb + title markup replaced with `<PageHeader>`
- `timeSince` utility now accepts `lang` param — returns vi/en/ja relative-time strings
- `getOrderStatusLabel` and `getRoleLabel` wired to i18n with fallback

### Fixed

- `TrackingModule`: `onModuleDestroy` cleanup hook was missing, leaving Redis subscribers open

---

## [0.1.0] — 2026-05-01

### Added

- JWT auth with RBAC (role guards: customer, driver, restaurant_owner, admin)
- Restaurant nearby search via PostGIS `ST_DWithin` + GIST index
- Menu management CRUD with categories and item options
- Cart session + order placement with stock validation
- Order state machine (14 states with history tracking)
- Driver dispatch: Redis GEO scoring (distance + rating), 30 s offer timeout, retry expansion to 10 km
- Real-time GPS tracking: WebSocket 3 s driver push → throttled 2 s broadcast → batch DB flush 15 s
- Customer mobile app (Flutter, Riverpod)
- Driver mobile app (Flutter, Riverpod)
- Admin dashboard (Next.js App Router)
- Restaurant dashboard (Next.js App Router)
- AI assistant integration via n8n + Gemini (chat classify + support tickets)
- Docker Compose stack with Prometheus, Grafana, Loki monitoring
- MinIO for food image + document storage
