# FoodFlow Testing Guide

## Latest local evidence (2026-07-05)

Latest verified runtime code includes `161ce9a`; Docker/E2E was rerun after docs head `e24631c`. The remote `codex/batch4-integration` branch was deleted earlier after patch-equivalence at `3857433`; the clean local worktree may still use local branch `codex/batch4-integration`, but it tracks `origin/master`. Remote CI/Actions remains pending because the GitHub token/auth/billing state is unavailable. Use `git ls-remote --heads origin` for the exact current `master` SHA after docs-only evidence commits.

- Frozen install passed for backend and web with pinned `pnpm 11.7.0`; mobile `flutter pub get --enforce-lockfile` passed.
- Backend passed `pnpm typecheck`, `pnpm lint`, full `pnpm test` (107 suites / 760 tests), and `pnpm build`; focused dispatch/order-code regressions passed 3 suites / 46 tests, and the latest route/ETA regressions passed 2 suites / 16 tests.
- Web passed `pnpm typecheck`, `pnpm lint`, `pnpm test` (Admin 35 files / 144 tests; Restaurant 28 files / 83 tests), and `pnpm build` (Admin 70 localized pages; Restaurant 55 localized pages).
- Docker Compose rebuilt Backend/Admin/Restaurant images from the current source with frozen installs; health checks passed for `http://[::1]:3001/api/healthz`, `http://[::1]:3000/api/healthz`, and `http://[::1]:3002/api/healthz` after the rebuild.
- Playwright passed Chromium + Firefox together at docs head `e24631c`: 70/70 tests with IPv6 loopback URLs. Coverage includes axe serious/critical smoke, visual contract, admin driver map navigation, tracking endpoint availability, realtime status flows, and tenant isolation.
- Mobile passed `flutter pub get --enforce-lockfile`, `flutter analyze`, full `flutter test` (166 tests), `dart analyze mobile/packages/api_client`, and Android debug APK builds for both `customer` and `driver` flavors. The APK builds emitted only a non-fatal future-compatibility warning from `share_plus` applying the Kotlin Gradle Plugin.
- Tracking contract refresh passed backend `pnpm exec jest src/tracking --runInBand` (5 suites / 41 tests) and focused dispatch/tracking regression tests (2 suites / 16 tests). OpenAPI YAML parse previously passed with 137 paths and `OrderTrackingResponse.routePhase` required.
- Dispatch/map evidence: restaurant acceptance now enqueues route-aware dispatch jobs with restaurant latitude/longitude and attempt metadata; the worker skips legacy malformed jobs, parses ioredis `GEOSEARCH WITHDIST` tuple rows, and no longer fails with `raw[i].replace is not a function`. The customer `driver:assigned` event now emits `etaMinutes: null` so the backend does not fabricate speed-based ETA before tracking has a Google/OSRM route.
- Security evidence: high-confidence tracked secret scan returned no matches. No tracked dotenv/key/credential files exist outside `.env.example` files. Native Firebase/provisioning artifacts are ignored. The legacy fake refund processor was removed; refunds now enqueue `payment-refund` and full refunds are marked only after SePay or wallet ledger reversal succeeds. Mobile idempotency keys are UUID v4, and mobile HTTP body logging is debug-only with redaction.

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

Latest local web/API-contract evidence: 2026-07-05 on the merged Batch 4 worktree, OpenAPI YAML parse passed with 137 paths and the local web endpoint coverage scanner previously reported `MISSING_ENDPOINTS=0`. `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` passed for the full web workspace; Vitest passed Admin 35 files / 144 tests and Restaurant 28 files / 83 tests. Backend validation passed `pnpm typecheck`, `pnpm lint`, full Jest (107 suites / 760 tests), and build.
Earlier map/tracking evidence: 2026-07-04 at `3252c6a`, backend `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, full `pnpm test` (106 suites / 752 tests), focused `route-utils.spec.ts` (11 tests), and `pnpm build` all passed. Admin driver map realtime validation passed `pnpm --filter foodflow-admin test` (34 files / 139 tests), `pnpm --filter foodflow-admin typecheck`, `pnpm --filter foodflow-admin lint`, web `pnpm install --frozen-lockfile`, and `pnpm --filter foodflow-admin build`. Additional 2026-07-05 evidence verifies customer mobile hydrates the initial `/orders/:id/tracking` REST snapshot before realtime events, honors `routePhase`, clears stale route geometry when the snapshot has no route, rejects invalid driver GPS, does not surface persisted estimated minutes without a routed cache, and passes `flutter analyze`, full `flutter test` (166 tests), backend tracking suite (5 suites / 41 tests), focused dispatch/tracking regression tests (2 suites / 16 tests), web typecheck, and OpenAPI/Spectral checks.
Latest current-head Restaurant web evidence: 2026-07-04 at `2cd87e5`, `pnpm --filter restaurant typecheck`, `pnpm --filter restaurant lint`, `pnpm --filter restaurant test` (27 files / 79 tests), and `pnpm --filter restaurant build` all passed. The production build generated the localized `vi`, `en`, and `ja` route set plus `/api/healthz`.
Latest current-head backend/web gate evidence: 2026-07-04 after `ad3b730`, backend `pnpm install --frozen-lockfile`, `pnpm prisma generate`, `pnpm typecheck`, `pnpm lint`, full `pnpm test` (106 suites / 752 tests), and `pnpm build` all passed. Web workspace `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (Admin 34 files / 139 tests; Restaurant 27 files / 79 tests), and `pnpm build` all passed. The Admin build generated 70 localized pages and the Restaurant build generated 55 localized pages across `vi`, `en`, and `ja`. Remote CI/Actions evidence for this head is still pending because account token/auth is unavailable.

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

Latest local E2E evidence: 2026-07-05 after the route/ETA fix and docs head `e24631c`, Docker Compose rebuilt healthy Backend/Admin/Restaurant standalone containers with `NEXT_PUBLIC_API_URL` provided at image build time. Because another local process was bound to `127.0.0.1:3000`, the verified local run used explicit IPv6 loopback endpoints: `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, `API_URL=http://[::1]:3001/api`. Full desktop Playwright passed Chromium + Firefox together, 70/70 tests, covering axe serious/critical smoke, visual contract, admin driver map navigation, tracking endpoint availability, realtime status flows, and tenant isolation.

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
Latest local mobile evidence: 2026-07-05 on `codex/batch4-integration`, `flutter pub get --enforce-lockfile` passed, `flutter analyze` found no issues, full `flutter test` passed 166 tests, and `dart analyze mobile/packages/api_client` found no issues. Android flavor debug APK builds passed for `flutter build apk --debug --flavor customer -t lib/main_customer.dart` and `flutter build apk --debug --flavor driver -t lib/main_driver.dart`, producing separate customer/driver package IDs and launcher labels. Google Maps native keys are env/local-xcconfig only, and Android release signing fails closed until `FOODFLOW_UPLOAD_*` signing secrets are provided. Backend route integrity gates also passed locally for the same map/tracking cluster: `pnpm typecheck`, `pnpm lint`, `pnpm build`, backend tracking suite (5 suites / 41 tests), and focused dispatch/tracking regression tests (2 suites / 16 tests).

Remote CI last fully ran green for `e776f5c`: Gitleaks `28704171253`, Lint `28704171260`, Build Check `28704171258`, SBOM `28704171266`, Trivy `28704171279`, CodeQL `28704171259`, CI `28704171265`, E2E Tests `28704171252`, and Integration Smoke Gate `28704171294`. Subsequent heads, including the latest Batch 4 local commits, could not start or complete remote jobs because GitHub Actions reported account billing/spending-limit or token/auth blockers. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests, and Integration Smoke Gate after billing/auth is fixed.

## Security Checks

Before every commit:

```bash
git diff --check
git diff --cached --check
```

Run staged and tracked-file secret scans. Ignore placeholders in `.env.example`, but block real tokens, private keys, database credentials, and service-role secrets.
