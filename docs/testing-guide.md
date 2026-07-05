# FoodFlow Testing Guide

## Latest local evidence (2026-07-05)

Branch: `codex/batch4-integration`. Remote CI/Actions remains pending because the GitHub token/auth/billing state is unavailable.

- Frozen install passed for backend and web with pinned `pnpm 11.7.0`; mobile `flutter pub get --enforce-lockfile` passed.
- Backend passed `pnpm typecheck`, `pnpm lint`, full `pnpm test` (105 suites / 750 tests), and `pnpm build`; targeted refund/tracking/driver route regressions passed 8 suites / 82 tests.
- Web passed `pnpm typecheck`, `pnpm lint`, `pnpm test` (Admin 34 files / 139 tests; Restaurant 27 files / 79 tests), and `pnpm build` (Admin 70 localized pages; Restaurant 55 localized pages).
- Docker Compose rebuilt Backend/Admin/Restaurant images from the current source with frozen installs; health checks passed for `http://[::1]:3001/api/healthz`, `http://[::1]:3000/api/healthz`, and `http://[::1]:3002/api/healthz`.
- Playwright passed `pnpm test:e2e --project=chromium` 35/35 and `pnpm test:e2e --project=firefox` 35/35 with IPv6 loopback URLs. Coverage includes axe serious/critical smoke, visual contract, admin driver map navigation, tracking endpoint availability, realtime status flows, and tenant isolation.
- Mobile passed `flutter analyze`, full `flutter test` (149 tests), focused `flutter test test/shared/tracking_provider_test.dart` (6/6 tests), and `dart analyze packages/api_client`. Latest Android debug APK build evidence remains the prior passing customer/driver flavor builds.
- Tracking contract refresh at `d5ecfcb` passed backend `pnpm jest src/tracking/tracking.controller.spec.ts --runInBand` (3/3 tests), web `pnpm typecheck`, OpenAPI YAML parse (137 paths; `OrderTrackingResponse.routePhase` required), and Spectral lint with 0 errors and one existing operation-tag warning.
- Security evidence: high-confidence tracked secret scan returned no matches. Native Firebase/provisioning artifacts are ignored. The legacy fake refund processor was removed; refunds now enqueue `payment-refund` and full refunds are marked only after SePay or wallet ledger reversal succeeds. Mobile idempotency keys are UUID v4, and mobile HTTP body logging is debug-only with redaction.

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

Latest local web/API-contract evidence: 2026-07-04 on `codex/batch4-integration`, OpenAPI YAML parse passed with 137 paths and the local web endpoint coverage scanner reported `MISSING_ENDPOINTS=0`. `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` passed for the full web workspace; Vitest passed Admin 34 files / 137 tests and Restaurant 27 files / 79 tests. Backend validation for this contract cluster passed `pnpm typecheck`, `pnpm lint`, and targeted Jest (`admin-resources.service.spec.ts`, `admin.heatmap.spec.ts`: 2 suites / 9 tests).
Earlier map/tracking evidence: 2026-07-04 at `3252c6a`, backend `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, full `pnpm test` (106 suites / 752 tests), focused `route-utils.spec.ts` (11 tests), and `pnpm build` all passed. Admin driver map realtime validation passed `pnpm --filter foodflow-admin test` (34 files / 139 tests), `pnpm --filter foodflow-admin typecheck`, `pnpm --filter foodflow-admin lint`, web `pnpm install --frozen-lockfile`, and `pnpm --filter foodflow-admin build`. Additional 2026-07-05 evidence at `d5ecfcb` verifies customer mobile hydrates the initial `/orders/:id/tracking` REST snapshot before realtime events, honors `routePhase`, clears stale route geometry when the snapshot has no route, rejects invalid driver GPS, and passes `flutter analyze`, full `flutter test` (149 tests), focused tracking provider tests (6/6), backend tracking controller tests (3/3), web typecheck, and OpenAPI/Spectral checks.
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

Latest local E2E evidence: 2026-07-04 at `14268da` on `codex/batch4-integration`, Docker Compose had healthy Backend/Admin/Restaurant standalone containers with `NEXT_PUBLIC_API_URL` provided at image build time. Because another local process was bound to `127.0.0.1:3000`, the verified local run used explicit IPv6 loopback endpoints: `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, `API_URL=http://[::1]:3001/api`. `pnpm test:e2e --project=chromium` passed 35/35 tests and `pnpm test:e2e --project=firefox` passed 35/35 tests, covering axe serious/critical smoke, visual contract, admin driver map navigation, tracking endpoint availability, and tenant isolation.

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
Earlier local mobile evidence: 2026-07-04 on `codex/batch4-integration`, `flutter pub get --enforce-lockfile` passed, focused map/route tests passed 14/14 (`directions_uri_test.dart`, `trip_route_provider_test.dart`, `encoded_polyline_test.dart`, `tracking_provider_test.dart`, `lat_lng_validation_test.dart`), `flutter analyze` found no issues, and full `flutter test` passed 143 tests. The new Android/iOS Flutter platform scaffold is present; Android flavor debug APK builds passed for `flutter build apk --debug --flavor customer -t lib/main_customer.dart` and `flutter build apk --debug --flavor driver -t lib/main_driver.dart`, producing separate customer/driver package IDs and launcher labels. Google Maps native keys are env/local-xcconfig only, and Android release signing now fails closed until `FOODFLOW_UPLOAD_*` signing secrets are provided. Backend route integrity gates also passed locally for the same map/tracking cluster: `pnpm typecheck`, `pnpm lint`, full `pnpm test` (106 suites, 752 tests), focused `route-utils.spec.ts`, and `pnpm build`.

Remote CI last fully ran green for `e776f5c`: Gitleaks `28704171253`, Lint `28704171260`, Build Check `28704171258`, SBOM `28704171266`, Trivy `28704171279`, CodeQL `28704171259`, CI `28704171265`, E2E Tests `28704171252`, and Integration Smoke Gate `28704171294`. Subsequent heads, including the latest Batch 4 local commits, could not start or complete remote jobs because GitHub Actions reported account billing/spending-limit or token/auth blockers. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests, and Integration Smoke Gate after billing/auth is fixed.

## Security Checks

Before every commit:

```bash
git diff --check
git diff --cached --check
```

Run staged and tracked-file secret scans. Ignore placeholders in `.env.example`, but block real tokens, private keys, database credentials, and service-role secrets.
