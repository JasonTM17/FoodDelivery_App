# FoodFlow Project Roadmap

Languages: [English](./project-roadmap.md) | [Tiếng Việt](./project-roadmap.vi.md) | [日本語](./project-roadmap.ja.md)

This roadmap reflects the integration branch direction. It separates what is already landed from what still must pass tests before a production deployment.

## Current priority: Batch 4 web/backend parity and mobile stabilization

Goal: make Admin and Restaurant dashboards production-grade against real backend data, then keep mobile/customer apps aligned with the stabilized Batch 4 contract while staying on Next.js 14, React 18, ESLint 8, pinned pnpm 11.7.0, and the current Flutter constraints.

Batch 4 is not complete until local gates, E2E, accessibility, visual checks, tenant-isolation checks, and deployment validation pass.

## Landed in the integration branch

- Clean integration worktree on `codex/batch4-integration`.
- Web response contract documented as `{ success: true, data, meta? }`.
- Error contract documented as RFC 7807 Problem Details.
- OpenAPI validation workflow and Spectral rules added.
- Shared web API client kept under `web/packages/api-client`.
- Restaurant revenue and analytics formatting localized.
- SePay runtime no longer fabricates successful intents when required configuration is missing.
- Vietnamese AI chat fast paths covered by focused tests.
- Core setup, testing, and deployment docs started in English, Vietnamese, and Japanese.
- Mobile Flutter gate was rechecked locally on 2026-07-05 at current head `d5ecfcb` with `flutter analyze` clean, `flutter test` passing 149 tests, and focused tracking snapshot tests passing 6/6. GitHub Actions for `d5ecfcb` is blocked by account token/auth or billing status, so remote checks must be rerun after that is fixed.
- Mobile runtime UI now has no remaining hardcoded presentation strings found by the targeted mobile scanner for the touched dispatch/cancel flows, no runtime "coming soon" actions, deterministic backend timestamp parsing instead of current-time payload fallbacks, and release builds require explicit `API_BASE_URL`.
- Driver/customer tracking maps now consume backend-routed `routePolyline` values, hydrate the initial `/orders/:id/tracking` REST snapshot before realtime events, keep telemetry trails separate from planned routes, support pickup/dropoff route phases, clear stale route geometry when the phase or snapshot changes, normalize driver GPS metadata to the backend km/h contract, and do not fabricate straight-line ETA minutes when route providers are unavailable.
- Admin shared tag input no longer invents default English placeholder copy; callers must provide localized placeholder text.
- Remote CI is last fully green for `e776f5c`: Gitleaks, Lint, Build Check, SBOM, Trivy, CodeQL, CI, E2E Tests, and Integration Smoke Gate. Current-head CI for `d5ecfcb` is blocked by GitHub token/auth or billing status before jobs start.

### Mobile

- Keep the Flutter customer/driver app aligned with the stabilized Batch 4 API contract.
- Do not regenerate or commit a mobile API client until the OpenAPI contract is intentionally refreshed.
- Reconcile Violet/Indigo only if branch refs or reviewed patch artifacts become available; the current `origin` head list does not expose those branches.
- Re-run `flutter analyze` and `flutter test` after backend/web contract changes that affect mobile behavior.

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
- If Violet or Indigo refs reappear, salvage mobile work hunk-by-hunk with focused Flutter tests and document the disposition here.
- Track the current branch audit in [branch-disposition.md](branch-disposition.md).
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

1. Push `codex/batch4-integration`.
2. Open a draft PR into `master`.
3. Attach branch disposition, test matrix, rejected changes, and known degraded states.
4. After required checks pass, merge with a merge commit.
5. Deploy database/realtime resources to Supabase only with valid rotated secrets.
6. Deploy web surfaces to Vercel only after local and PR gates are green.
7. Run production smoke tests, realtime checks, map checks, AI chatbot checks, and keep-alive monitoring.

## Deferred out of Batch 4

- Next.js, React, ESLint, or Node major migrations.
- httpOnly cookie auth migration.
- Data warehouse or OLAP redesign.
- Nodemailer major migration.
- Dependency major upgrades that conflict with Next.js 14, React 18, or ESLint 8.
- Deployment before all gates are green.
