# FoodFlow Batch 4 Release Report

Last updated: **2026-07-10**. Status: **local hardening in progress; production release blocked**.

## Release identity

| Item | Current value |
|---|---|
| Remote repository | `JasonTM17/FoodDelivery_App` (private) |
| Remote branches | `master` only |
| Remote head | `origin/master@df945dd2c572e690a3c9e7aa31130c517ef83880` |
| Local release branch | `codex/batch4-integration` in the isolated worktree |
| Local code head before docs | `e74a5b43710f1317579de7d1ebc01a590d001909` |
| Ahead/behind before docs | `0 / 99` relative to `origin/master` |
| Planned release | `v4.0.0` after all gates |
| Production deployment | Not completed |

The local branch has not been pushed by name because that would recreate a second remote branch. Final integration is a direct fast-forward `HEAD:master` after release approval.

## Landed hardening

### Backend and data

- Provider-selectable Supabase Realtime, Storage, and PostgreSQL job outbox with fail-closed production validation.
- `POST /api/realtime/token` issues five-minute Supabase JWTs only after order/restaurant ownership checks and returns explicit channel names.
- `realtime_outbox` RLS permits authenticated reads only when the row channel is present in JWT claims; only that table is added to the explicit Supabase Realtime publication.
- `GET|POST /api/jobs/drain` requires `CRON_SECRET`; Vercel Cron uses the persisted job outbox instead of relying on a long-lived BullMQ worker.
- Storage supports Supabase server-side upload/delete and signed review uploads; MinIO remains the compatibility provider.
- DeepSeek `deepseek-v4-flash` adapter, session ownership, explicit fail-closed states, support escalation, and persisted token/cost/latency telemetry.
- Tracking and dispatch reject stale/future/malformed GPS, preserve route phase, persist provider geometry, and avoid fabricated location/ETA fallbacks.
- Admin exports, promotions, support, notifications, restaurant analytics/menu/staff/reviews, and mobile order/tracking paths validate successful envelopes instead of turning contract failures into fake empty business data.

### Web

- Admin and Restaurant support Supabase Realtime subscriptions while retaining explicit Socket.IO local mode.
- Restaurant locale is URL-authoritative under one `NextIntlClientProvider`; fresh `/vi`, `/en`, and `/ja` contexts no longer inherit stale cookie/session locale.
- Error/validation states meet the tested serious/critical accessibility contrast threshold and expose keyboard focus.
- Production public env is fail-closed; legacy socket URL is not required when the provider is Supabase.
- Current product media is generated from the isolated current-source stack, not a stale production alias.

### Mobile

- Existing hardening covers fresh GPS timestamps, route phase/geometry validation, non-fabricated map cameras/ETA, nearby contract alignment, and vi/en/ja generated localization.
- Production mobile Supabase Realtime parity is **not landed yet**. The package still imports `socket_io_client`; this is a release task, not a completed claim.

### DevOps and supply chain

- Node.js baseline is 22.13+ and pnpm is pinned to 11.11.0.
- Backend, migration, Admin, and Restaurant images are non-root and support `linux/amd64` plus `linux/arm64`.
- Debian/glibc builders and architecture-aware Sharp/native dependencies prevent Alpine-to-distroless ABI mismatches.
- GitHub Actions in the Docker release workflow are pinned to full commits; Trivy is pinned to a post-remediation immutable release commit.
- CI pushes SHA manifests first, smokes native runtime dependencies on both architectures, scans both architectures, checks production health, then creates an immutable semver tag. A conflicting existing semver digest causes failure.
- `latest` promotion is manual and occurs only after semver release success.

## Latest local evidence

Evidence below applies to the current hardening line unless explicitly marked historical.

| Gate | Evidence |
|---|---|
| Web typecheck/lint | Admin + Restaurant passed; ESLint reported no warnings/errors (Next 15 deprecation notice only). |
| Web unit/component | Admin 44 files / 184 tests; Restaurant 36 files / 119 tests; total 303 passed. |
| Web production build | Admin generated 70 localized pages; Restaurant generated 55. Missing required public env failed closed as intended. |
| Playwright contract | Chromium + Firefox passed 18/18 against the isolated current-source stack. |
| Accessibility | Intentional CORS/error-state Chromium + Firefox checks passed 2/2 with axe serious/critical = 0. Earlier broad page smoke remains useful but must be rerun after final UI changes. |
| Docker runtime | Backend, migrate, Admin, Restaurant passed native runtime checks on both `amd64` and `arm64`; non-root UIDs verified. |
| Docker security | Trivy 0.72.0 scanned four artifacts × two architectures: 8/8 passed with zero High/Critical findings. |
| Docker health | Fresh database applied all 22 migrations; API, Admin, and Restaurant health returned 200. |
| Workflow/config | Actionlint passed all workflows; base/self-hosted Compose configs and the local release mini-gate passed. |
| Secret hygiene | High-confidence tracked and staged scans found no live token/private key; real dotenv files remain untracked. |
| Documentation media | 20 current-source Admin/Restaurant screenshots and two optimized GIFs captured through the real seeded API. |

A fresh full backend Prisma/typecheck/lint/Jest/build gate, full mobile analyze/test after realtime migration, complete cross-page visual/axe suite, and all remote workflows are still required before release. Historical counts are not substituted for those final gates.

## Product-media QA finding

The first capture used `127.0.0.1`, correctly triggered the isolated stack's CORS fail-closed behavior, and was discarded. Recapture through the configured `localhost` origin loaded real seeded API data.

Visual review then found Vietnamese Admin overview KPI labels still rendered in English. This is a real i18n polish defect; the media must be recaptured after that UI cluster is fixed. The finding is not hidden by editing screenshots.

## Registry audit

Docker Hub was queried anonymously on 2026-07-10:

| Repository | Current newest release-like tag | Batch 4 status |
|---|---|---|
| `foodflow-backend` | `95759be` / `latest` | Older than local head |
| `foodflow-migrate` | `95759be` / `latest` | Older than local head |
| `foodflow-admin` | `0ab94ad` / `latest` | Older than local head |
| `foodflow-restaurant` | `0ab94ad` / `latest` | Older than local head |
| `foodflow-worker` | historical duplicate of backend digest | Superseded; worker now runs from backend image |

No current `sha-e74a5b4...` or `v4.0.0` release was published. GHCR is not verified and is intentionally absent from public package guidance. Publishing old or unscanned `latest` images would be misleading, so registry publication remains gated.

## External preflight status

### Supabase

`infra/scripts/supabase-preflight.ps1` currently stops before mutation because `SUPABASE_ACCESS_TOKEN` is absent from the secure CLI environment. It also requires a visible `SUPABASE_PROJECT_REF`, non-local pooled `DATABASE_URL`, and direct `DIRECT_URL`. OAuth/MCP access is not treated as a substitute for CLI migration credentials.

### Vercel

Project settings are visible, but production env preflight reports:

- API missing database/Supabase/provider integration secrets, including DeepSeek, Maps/routing, SePay, notification, and messaging values.
- Admin missing `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Restaurant missing `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Secret values are intentionally never printed or stored in this report. Any DeepSeek key previously pasted in chat is exposed and must be rotated, even if the same value was later added to a dashboard.

### GitHub Actions

The user reports billing/token/auth exhaustion. No local result may be represented as fresh remote CI. Required workflows include CI, Build, Lint, Mobile, E2E, Integration, OpenAPI, Gitleaks, CodeQL, Trivy, and SBOM.

## Remaining release gates

1. Fix visual i18n defects and recapture final media.
2. Move mobile production realtime to the Supabase token/channel contract and run Flutter analyze/test/build checks.
3. Run fresh frozen installs and complete backend/web/mobile suites at the final source head.
4. Run Chromium + Firefox full E2E, axe serious/critical, visual, tenant isolation, realtime authorization, shipper route/map, export, payment, and AI fail-closed/live smoke.
5. Rotate exposed keys and complete Supabase/Vercel secure preflights.
6. Restore remote CI and obtain green current-head workflow evidence.
7. Deploy Supabase, then Vercel API, Admin, and Restaurant; verify production health and behavior.
8. Fast-forward `HEAD` to `master`, publish immutable Docker manifests, and only then manually promote `latest`.

## Release decision

**NO-GO** at this snapshot. The repository is materially hardened and remote branch cleanup is complete, but production credentials, mobile realtime parity, final current-head gates, remote CI, and production smoke are mandatory and unresolved. No secret should be invented, copied from chat, committed, or bypassed to change this decision.
