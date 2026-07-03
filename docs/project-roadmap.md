# FoodFlow Project Roadmap

Languages: [English](./project-roadmap.md) | [Tiếng Việt](./project-roadmap.vi.md) | [日本語](./project-roadmap.ja.md)

This roadmap reflects the integration branch direction. It separates what is already landed from what still must pass tests before a production deployment.

## Current priority: Batch 4 web/backend parity

Goal: make Admin and Restaurant dashboards production-grade against real backend data while keeping Next.js 14, React 18, ESLint 8, pnpm 10, and the existing mobile/customer contracts.

Batch 4 is not complete until local gates, E2E, accessibility, visual checks, tenant-isolation checks, and deployment validation pass.

## Landed in the integration branch

- Clean integration worktree on `batch4-integration`.
- Web response contract documented as `{ success: true, data, meta? }`.
- Error contract documented as RFC 7807 Problem Details.
- OpenAPI validation workflow and Spectral rules added.
- Shared web API client kept under `web/packages/api-client`.
- Restaurant revenue and analytics formatting localized.
- SePay runtime no longer fabricates successful intents when required configuration is missing.
- Vietnamese AI chat fast paths covered by focused tests.
- Core setup, testing, and deployment docs started in English, Vietnamese, and Japanese.

## In progress before draft PR

### Backend

- Remove remaining runtime mock/fallback behavior in payment, promotion, support, analytics, and reporting paths.
- Finish canonical Admin export jobs on the existing `AdminExportJob` model.
- Finish Platform Settings endpoints backed by `PlatformSetting`.
- Verify order/revenue/category attribution by order item value.
- Verify benchmark privacy: cohort must have at least 10 restaurants, otherwise use aggregate platform data without exposing identities.
- Verify support SLA rules in ICT business hours with pause while waiting for customer.

### Admin dashboard

- Finish real-data dashboard KPI, comparisons, timeseries, heatmap, and recent orders.
- Finish orders list/detail/status updates and WebSocket `/events` status with controlled polling fallback.
- Finish restaurant approval detail, menu/orders/reviews/finance/KPI.
- Finish users, wallet, voucher, refund, and KYC views.
- Finish promotions CRUD, toggle, analytics, and overlap validation.
- Finish support queue/detail/messages/reply/internal note/bulk action/macros/CSAT.
- Finish audit logs and exports with progress and downloads.
- Keep settings and AI monitor either real-data backed or explicitly degraded.

### Restaurant dashboard

- Finish profile, onboarding, and operating hours.
- Finish overview KPI from real data.
- Finish menu categories/items/options visibility and reorder.
- Finish kanban orders, detail, status transitions, and order chat.
- Finish reviews and merchant reply.
- Finish revenue drill-down and export formats.
- Finish promotions CRUD, targeting preview, scheduling, analytics, and broadcast.
- Finish staff invitations, permissions, and shift schedule.
- Finish insights, menu analytics, and privacy-safe benchmark.
- Use shared notifications from `/notifications`.

### UI, UX, and design

- Keep the existing seven Stitch desktop screens as visual baseline.
- Add focused Stitch designs only where a real screen gap remains.
- Apply dark sidebar, orange/green accents, dense cards, and consistent filters/action bars.
- Add loading, empty, retryable error, permission-denied, disabled, success, and destructive-confirmation states.
- Validate responsive layouts at 1440, 1280, tablet, and mobile widths.
- Design and store approved logos/assets in app `public/` or docs asset folders, not at repo root.

### Maps and AI chatbot

- Keep maps backed by real provider state: Google Maps when configured, OSRM/backend fallback when allowed by product behavior, and clear degraded states when neither path is available.
- Keep AI chatbot backed by the LLM provider adapter, with DeepSeek as the current default and explicit degraded responses when configuration is missing.
- Rotate any exposed API key before production and store real values only in ignored environment files or provider secret stores.

### Repository hygiene and branch salvage

- Do not raw-merge stale team branches.
- Port only proven behavior from Amber, Steel, and audit branches with focused tests.
- Defer Violet and Indigo mobile reconciliation to separate mobile branches after Batch 4 web/backend is stable.
- Keep generated screenshots, local caches, backup folders, and assistant private files out of Git.

## Required gates before deployment

- `pnpm install --frozen-lockfile` in a clean environment.
- Backend Prisma validate/generate/migration checks, typecheck, lint, Jest, contract tests, and build.
- Web API client generation/typecheck and OpenAPI validation.
- Admin and Restaurant typecheck, ESLint with no warnings, Vitest, and production builds.
- Playwright on Chromium and Firefox for login, RBAC, locale, promotions, support, exports, WebSocket orders, menu, revenue, staff, insights, maps, and AI chatbot.
- Axe scan with no serious or critical issues.
- Visual regression against approved Stitch screens.
- Tenant-isolation tests for restaurant-scoped reads and writes.
- Secret scan, artifact scan, and `.gitignore` hygiene check.

## Deployment plan after green gates

1. Push `batch4-integration`.
2. Open a draft PR into `master`.
3. Attach branch disposition, test matrix, rejected changes, and known degraded states.
4. After required checks pass, merge with a merge commit.
5. Deploy database/realtime resources to Supabase only with valid rotated secrets.
6. Deploy web surfaces to Vercel only after local and PR gates are green.
7. Run production smoke tests, realtime checks, map checks, AI chatbot checks, and keep-alive monitoring.

## Deferred out of Batch 4

- Mobile Violet and Indigo reconciliation.
- Next.js, React, ESLint, or Node major migrations.
- httpOnly cookie auth migration.
- Data warehouse or OLAP redesign.
- Nodemailer major migration.
- Dependency major upgrades that conflict with Next.js 14, React 18, or ESLint 8.
- Deployment before all gates are green.
