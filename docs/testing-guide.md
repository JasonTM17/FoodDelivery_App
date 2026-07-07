# FoodFlow Testing Guide

## Latest local evidence (2026-07-07)

Verified remote code head: `118459e` on `origin/master` before this local hardening refresh. Remote `codex/batch4-integration` is deleted; the clean local worktree still uses local branch `codex/batch4-integration`, tracking `origin/master`, with latest local code head `9c32d01` ahead of `origin/master` by 23 commits before this docs refresh. The latest whole-app non-deploy release gate remains `89f0d0e`, with focused driver-incentive validation added at `9c32d01`. Remote CI/Actions remains pending because GitHub token/auth/billing access is unavailable.

- Frozen install passed for backend and web with pinned `pnpm 11.7.0`; mobile `flutter pub get --enforce-lockfile` passed.
- Backend passed Prisma validate with explicit test `DATABASE_URL`/`DIRECT_URL`, `pnpm typecheck`, `pnpm lint`, full `pnpm exec jest --runInBand` (110 suites / 803 tests), and `pnpm build`.
- Web passed `pnpm typecheck`, `pnpm lint`, full Vitest (Admin 37 files / 155 tests; Restaurant 31 files / 100 tests), and `pnpm build` (Admin 70 localized pages; Restaurant 55 localized pages).
- Docker Compose rebuilt Backend/Admin/Restaurant images from the current source at `89f0d0e`; health checks passed for `http://[::1]:3001/api/healthz`, `http://[::1]:3000/api/healthz`, and `http://[::1]:3002/api/healthz` after the rebuild.
- Playwright passed Chromium + Firefox together after that rebuild: 70/70 tests with IPv6 loopback URLs. Coverage includes axe serious/critical smoke, visual contract, admin driver map navigation, tracking endpoint availability, realtime status flows, and tenant isolation.
- Mobile passed `flutter pub get --enforce-lockfile`, `flutter analyze`, and full `flutter test` 229/229 in the `89f0d0e` local release gate. Earlier APK evidence remains valid for debug packaging and emitted only a non-fatal future-compatibility warning from `share_plus` applying the Kotlin Gradle Plugin.
- OpenAPI/Spectral passed with `npx -y @stoplight/spectral-cli lint docs/openapi.yaml --ruleset docs/openapi/.spectral.yaml --fail-severity error`.
- Security evidence: high-confidence tracked/staged scans found no live provider token or private key matches. No tracked dotenv/key/credential files exist outside `.env.example` files. Generic candidates were reviewed as test variable names, local-only forbidden production defaults, or static Redis Lua scripts. `gitleaks` is not installed locally; rerun Gitleaks in CI when Actions auth is restored.
- Earlier hardening evidence after `94d4e18`: mobile nearby+i18n tests passed 19/19 and full `flutter test` passed 229/229 after aligning nearby/filter calls with the backend contract. High-confidence HEAD secret scan found no live provider token/private-key matches. Runtime keyword scan over `backend/src`, Admin source, Restaurant source, and `mobile/lib` found no `Math.random`, faker, or mock business-data generator in production source; remaining hits were UI placeholders/loading fallbacks, fail-closed config guards, or localization metadata.
- Current backend route/dispatch evidence after `c825ad5`: focused Jest passed 5 suites / 60 tests for tracking service/gateway, ETA recompute, drivers, and dispatch; backend `pnpm typecheck` and `pnpm lint` also passed. The new coverage verifies order-facing dispatch events use the orders gateway and provider route metrics persist to `delivery_tasks` by pickup/dropoff phase.
- Current backend driver-incentives evidence after `9c32d01`: persisted `driver_incentive_campaigns` records now drive active/completed campaign progress from delivered driver tasks instead of a `501` placeholder. Prisma generate/validate, focused Jest for incentives/env validation (3 suites / 10 tests), backend `pnpm typecheck`, `pnpm lint`, `pnpm build`, OpenAPI Spectral, and focused mobile incentive tests (7/7) passed.
- Current whole-app local gate at `89f0d0e`: `powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\local-release-gate.ps1 -SkipDeployPreflight` passed after setting an explicit secure Restaurant build-time URL, and `pnpm test:e2e --project=chromium --project=firefox` passed 70/70 against rebuilt Docker services. Deploy preflight was not bypassed for production readiness and remains blocked by missing Supabase/Vercel production configuration.

Languages: [English](testing-guide.md) | [Tiếng Việt](testing-guide.vi.md) | [日本語](testing-guide.ja.md)

## Backend

```bash
cd backend
pnpm prisma validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Focused examples:

```bash
pnpm test -- sepay.provider.spec.ts payments.service.spec.ts
pnpm test -- ai-chat.service.spec.ts deepseek-chat-provider.service.spec.ts ai-chat.controller.spec.ts
pnpm test -- restaurant-revenue.service.spec.ts
```

Backend tests must prove real behavior: no runtime mock payments, no fabricated AI answers, no random business values, and tenant-scoped queries for restaurant/admin surfaces.

Backend coverage thresholds are enforced in `backend/jest.config.ts`; do not pass JSON thresholds through shell-specific CLI quoting.

### AI scenario smoke gate

`pnpm db:big-seed` creates deterministic AI smoke orders `FF-001`, `FF-002`, `FF-003`, `FF-004`, `FF-006`, `FF-007`, `FF-008`, `FF-009`, and `FF-010` for `customer1@foodflow.vn`. The integration workflow logs in through `/api/auth/login` and runs `e2e/ai-scenarios/run-ai-scenarios.ts` against the authenticated `/api/ai/chat` endpoint.

CI may set `AI_ALLOW_DEGRADED=true` when no LLM provider secret is available; this still verifies auth, tool grounding, tenant-scoped order lookup, support-ticket escalation, and hallucination guards. Release verification must run without degraded mode and with a rotated, valid `DEEPSEEK_API_KEY` from the secret manager.

## Web

```bash
cd web
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Focused dashboard checks:

```bash
pnpm --filter foodflow-admin typecheck
pnpm --filter foodflow-admin lint
pnpm --filter foodflow-admin test
pnpm --filter foodflow-admin build

pnpm --filter restaurant typecheck
pnpm --filter restaurant lint
pnpm --filter restaurant test
pnpm --filter restaurant build
```

Latest local web/API-contract evidence: OpenAPI Spectral lint passed with `--fail-severity error`. `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` passed for the full web workspace; Vitest passed Admin 37 files / 155 tests and Restaurant 31 files / 100 tests. Backend validation passed Prisma validate, `pnpm typecheck`, `pnpm lint`, full Jest (110 suites / 803 tests), and build.
Earlier map/tracking and 2026-07-04/2026-07-06 matrices remain useful for history, but the current whole-app local verification is the 2026-07-07 `89f0d0e` matrix in [Batch 4 release report](batch4-release-report.md), with focused driver-incentive validation at `9c32d01`.

## Playwright E2E

Install browsers once:

```bash
cd web
pnpm test:e2e:install
```

Run seeded E2E against real local services:

```bash
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
```

Latest local E2E evidence: 2026-07-06 on `33e90ea`, Docker Compose rebuilt healthy Backend/Admin/Restaurant standalone containers with `NEXT_PUBLIC_API_URL` provided at image build time. Because another local process was bound to `127.0.0.1:3000`, the verified local run used explicit IPv6 loopback endpoints: `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, `API_URL=http://[::1]:3001/api`. Full desktop Playwright passed Chromium + Firefox together, 70/70 tests, covering axe serious/critical smoke, visual contract, admin driver map navigation, tracking endpoint availability, realtime status flows, and tenant isolation. The E2E harness now fails fast if a local route resolves to a Next.js 404 shell.

Batch 4 E2E coverage should include:

- Login and RBAC
- Locale redirects and `/:locale` navigation
- Admin order feed/WebSocket and controlled polling fallback
- Promotion CRUD and overlap validation
- Support queue/detail/messages/macros/CSAT
- Export job create/progress/download
- Restaurant menu/category/item/option CRUD and reorder
- Revenue, staff, insights, benchmark
- Notifications
- Tenant isolation, including `web/e2e/tests/tenant-isolation.spec.ts`: restaurant users must not list, read, or update another restaurant tenant's orders.

Realtime security regression coverage must also verify:

- Missing, refresh, expired, or invalid Socket.IO tokens cannot connect.
- Non-admin users cannot join Admin order or driver rooms.
- Restaurants cannot join another tenant's room.
- Customers, drivers, and restaurant staff cannot join unrelated order rooms.
- Only authenticated drivers can publish GPS updates.
- Mobile driver GPS metadata is normalized before publish: Geolocator speed is converted from m/s to backend km/h, and invalid heading/speed/accuracy values are dropped.
- Driver/customer maps must draw backend `routePolyline` separately from raw telemetry trails.
- Route deviation checks must snap to connected polyline segments, not only vertices, so sparse provider routes do not falsely mark a driver as off-route.
- Route geometry is cleared when an order changes from pickup phase to dropoff phase so clients do not draw stale restaurant-bound routes after pickup.
- If Google/OSRM route providers are unavailable, tracking emits `etaMinutes: null` and `source: route_unavailable`; the backend must not fabricate straight-line ETA minutes.
- Admin driver maps must clear stale `currentOrder` when realtime sends `orderId: null` and ignore invalid realtime coordinates before passing them to Google Maps.
- Mobile driver “Open directions” must pass the current driver coordinates as Google Maps `origin` when available, use navigation mode, and show an explicit unavailable state for invalid destinations.
- Mobile driver route replay and demand heatmap must render real Google Maps overlays from backend route/demand coordinates; do not replace them with schematic canvas-only maps or generated local points.
- Notification clients cannot subscribe or mutate data as another user.
- Dispatch offer rooms and accept/reject actions are bound to the authenticated driver ID.
- Admin and Restaurant web clients send the latest access token during reconnect.

## Accessibility and Visual QA

- Run axe checks and require zero serious/critical issues.
- Validate keyboard navigation, visible focus, dialog focus trap, and chart/table alternatives.
- Run `web/e2e/tests/visual-contract.spec.ts` with the Playwright suite. It verifies the Admin and Restaurant FoodFlow login brand shells, responsive centering, SVG logo tokens, CTA contrast, and stores review screenshots under Playwright `test-results`.
- Compare Admin and Restaurant screens against approved Stitch references.
- No approved Stitch bitmap baseline is currently stored in this repo; add reviewed Stitch exports before replacing the contract guard with pixel `toHaveScreenshot` snapshots.
- Check desktop 1440/1280, tablet, and mobile responsive layouts.

## Mobile

Mobile is reconciled after web/backend Batch 4 stabilizes.

```bash
cd mobile
flutter pub get
flutter pub get --enforce-lockfile
flutter analyze
flutter test
```

Mobile API clients must use the stabilized Batch 4 OpenAPI contract; do not commit generated mobile clients before the contract is final.
The Batch 4 mobile gate currently requires frozen install, `flutter analyze` with zero issues, the full Flutter test suite passing, and Android debug APK compilation for both customer and driver entrypoints.
Latest local mobile evidence: `flutter pub get --enforce-lockfile` passed earlier, `flutter analyze` found no issues, full `flutter test` passed 229/229 tests after nearby/filter contract hardening, focused nearby+i18n tests passed 19/19, focused tracking/driver route/heatmap tests previously passed 22/22, and `flutter build apk --debug` previously produced `build/app/outputs/flutter-apk/app-debug.apk`. The APK build emitted only a non-fatal future-compatibility warning from `share_plus` applying the Kotlin Gradle Plugin. Google Maps native keys are env/local-xcconfig only, and Android release signing fails closed until `FOODFLOW_UPLOAD_*` signing secrets are provided.

Remote CI last fully ran green for `e776f5c`: Gitleaks `28704171253`, Lint `28704171260`, Build Check `28704171258`, SBOM `28704171266`, Trivy `28704171279`, CodeQL `28704171259`, CI `28704171265`, E2E Tests `28704171252`, and Integration Smoke Gate `28704171294`. Subsequent heads, including the latest Batch 4 local commits, could not start or complete remote jobs because GitHub Actions reported account billing/spending-limit or token/auth blockers. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests, and Integration Smoke Gate after billing/auth is fixed.

## Security Checks

Before every commit:

```bash
git diff --check
git diff --cached --check
```

Run staged and tracked-file secret scans. Ignore placeholders in `.env.example`, but block real tokens, private keys, database credentials, and service-role secrets.
