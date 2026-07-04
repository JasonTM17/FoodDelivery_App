# FoodFlow Testing Guide

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

Latest local web evidence: 2026-07-04 on `codex/batch4-integration` at `e776f5c`, `pnpm typecheck` passed, `pnpm lint` passed, and `pnpm test` passed all Admin and Restaurant Vitest suites (Admin 135 tests, Restaurant 79 tests).

## Playwright E2E

Install browsers once:

```bash
cd web
pnpm test:e2e:install
```

Run seeded E2E against real local services:

```bash
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox
```

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
flutter analyze
flutter test
```

Mobile API clients must use the stabilized Batch 4 OpenAPI contract; do not commit generated mobile clients before the contract is final.
The Batch 4 mobile gate currently requires `flutter analyze` with zero issues and the full Flutter test suite passing.
Latest local evidence: 2026-07-04 after Batch 4 mobile cleanup, `flutter analyze` found no issues and `flutter test` passed 131 tests. GitHub Mobile CI is green for the latest mobile-touching commit `0fe1895`. Full branch CI is green for `e776f5c`: Gitleaks `28704171253`, Lint `28704171260`, Build Check `28704171258`, SBOM `28704171266`, Trivy `28704171279`, CodeQL `28704171259`, CI `28704171265`, E2E Tests `28704171252`, and Integration Smoke Gate `28704171294`.

## Security Checks

Before every commit:

```bash
git diff --check
git diff --cached --check
```

Run staged and tracked-file secret scans. Ignore placeholders in `.env.example`, but block real tokens, private keys, database credentials, and service-role secrets.
