# FoodFlow Batch 4 Release Report

Last updated: **2026-07-11**. Status: **local hardening in progress; production release blocked**.

## Release identity

| Item | Current value |
|---|---|
| Remote repository | `JasonTM17/FoodDelivery_App` (private) |
| Remote branches | `master` only |
| Remote head | `origin/master@df945dd2c572e690a3c9e7aa31130c517ef83880` |
| Local release branch | `codex/batch4-integration` in the isolated worktree |
| Local code head before docs | `924808c47ca7de1aa001693bdfcca3c4ff293a9f` |
| Ahead/behind before docs | `0 / 106` relative to `origin/master` |
| Planned release | `v4.0.0` after all gates |
| Production deployment | Not completed |

The local branch has not been pushed by name because that would recreate a second remote branch. Final integration is a direct fast-forward `HEAD:master` after release approval.

## Landed hardening

### Backend and data

- Provider-selectable Supabase Realtime, Storage, and PostgreSQL job outbox with fail-closed production validation.
- `POST /api/realtime/token` issues five-minute Supabase JWTs only after order/restaurant ownership checks and returns explicit channel names.
- `realtime_outbox` RLS permits authenticated reads only when the row channel is present in JWT claims; only that table is added to the explicit Supabase Realtime publication.
- `GET|POST /api/jobs/drain` requires `CRON_SECRET`; Vercel Cron uses the persisted job outbox instead of relying on a long-lived BullMQ worker.
- Storage supports Supabase server-side upload/delete and dedicated private driver KYC signed upload/read capabilities; MinIO remains the compatibility provider.
- DeepSeek `deepseek-v4-flash` adapter, session ownership, explicit fail-closed states, support escalation, and persisted token/cost/latency telemetry.
- Tracking and dispatch reject stale/future/malformed GPS, preserve route phase, persist provider geometry, and avoid fabricated location/ETA fallbacks.
- Admin exports, promotions, support, notifications, restaurant analytics/menu/staff/reviews, and mobile order/tracking paths validate successful envelopes instead of turning contract failures into fake empty business data.
- Driver KYC now requires accepted terms, four owner-scoped private objects, MIME/size/signature validation, one pending submission, bounded retries, atomic review, RLS, and short-lived signed Admin reads. Public document URLs are rejected.

### Web

- Admin and Restaurant support Supabase Realtime subscriptions while retaining explicit Socket.IO local mode.
- Restaurant locale is URL-authoritative under one `NextIntlClientProvider`; fresh `/vi`, `/en`, and `/ja` contexts no longer inherit stale cookie/session locale.
- Error/validation states meet the tested serious/critical accessibility contrast threshold and expose keyboard focus.
- Production public env is fail-closed; legacy socket URL is not required when the provider is Supabase.
- Current product media is generated from the isolated current-source stack, not a stale production alias.

### Mobile

- Existing hardening covers fresh GPS timestamps, route phase/geometry validation, non-fabricated map cameras/ETA, nearby contract alignment, and vi/en/ja generated localization.
- Managed Customer/Driver realtime now uses scoped Supabase token/channel grants and allow-listed receive-only outbox events; GPS and dispatch decisions remain authenticated REST mutations. `socket_io_client` is retained only for explicit local/self-hosted mode.
- Driver login checks the authenticated KYC status, onboarding preserves normalized license/vehicle data, uploads never forward bearer credentials or derive public URLs, and the actual release entry point delegates to the complete Driver router.

### DevOps and supply chain

- Node.js baseline is 22.13+ and pnpm is pinned to 11.11.0.
- Backend, migration, Admin, and Restaurant images are non-root and support `linux/amd64` plus `linux/arm64`.
- Debian/glibc builders and architecture-aware Sharp/native dependencies prevent Alpine-to-distroless ABI mismatches.
- GitHub Actions in the Docker release workflow are pinned to full commits; Trivy is pinned to a post-remediation immutable release commit.
- CI pushes SHA manifests first, smokes native runtime dependencies on both architectures, scans both architectures, checks production health, then creates an immutable semver tag. A conflicting existing semver digest causes failure.
- `latest` promotion is manual and occurs only after semver release success.

## Latest local evidence

Evidence below distinguishes current-line checks from historical broader runs. Historical evidence is never release approval for the final head.

| Gate | Evidence |
|---|---|
| Backend current-line | KYC/config/notification 5 suites / 48 tests, typecheck, and lint passed. |
| Database current-line | Fresh isolated PostGIS applied all 24 migrations; KYC RLS, table comment, and one-pending partial unique index were verified. |
| Mobile current-line | Flutter analyze and all 274 tests passed; the real `lib/main_driver.dart` entry built a Driver debug APK. |
| Admin/OpenAPI current-line | Shared API client + Admin typecheck passed, KYC modal 5/5 passed, and Spectral reported no errors. |
| Web historical | Admin/Restaurant typecheck/lint, 305 Vitest tests, and 70/55 localized production pages passed before the latest KYC/docs commits. Rerun required. |
| Browser/a11y historical | Contract 18/18 plus locale/cookie 6/6 passed across Chromium/Firefox; focused axe serious/critical = 0. Full cross-page rerun required. |
| Docker historical | Four non-root artifacts passed `amd64`/`arm64` runtime smoke and 8/8 Trivy scans with zero High/Critical findings before current head. Rerun required. |
| Workflow/config historical | Actionlint, Compose configs, and the local release mini-gate passed before current head. Rerun required. |
| Secret hygiene | The staged scan for `924808c` found no live token/private key; real dotenv files remained untracked. A full final-head Gitleaks scan is still required. |
| Documentation media | 20 current-source Admin/Restaurant screenshots and two optimized GIFs captured through the real seeded API. |

A fresh full backend Prisma/typecheck/lint/Jest/build gate, full web/mobile builds, complete cross-page visual/axe suite, production-like tenant/realtime/map/KYC/AI smoke, and all remote workflows are still required before release. Historical counts are not substituted for those final gates.

## Product-media QA finding

The first capture used `127.0.0.1`, correctly triggered the isolated stack's CORS fail-closed behavior, and was discarded. Recapture through the configured `localhost` origin loaded real seeded API data.

Visual review found Vietnamese Admin overview KPI labels rendered in English and two serious contrast failures. Commit 7ab9633 localized KPI labels by stable metric key, made URL locale authoritative for the Admin root, and hardened semantic color tokens. Fresh vi/en/ja Chromium and Firefox checks passed with conflicting cookies and axe serious/critical = 0; the accepted media was then recaptured from that build.

## Registry audit

Docker Hub was queried anonymously again on 2026-07-11:

| Repository | Current newest release-like tag | Batch 4 status |
|---|---|---|
| `foodflow-backend` | `95759be` / `latest` | Older than local head |
| `foodflow-migrate` | `95759be` / `latest` | Older than local head |
| `foodflow-admin` | `0ab94ad` / `latest` | Older than local head |
| `foodflow-restaurant` | `0ab94ad` / `latest` | Older than local head |
| `foodflow-worker` | historical duplicate of backend digest | Superseded; worker now runs from backend image |

No current `sha-924808c...` or `v4.0.0` release was published. GHCR is not verified and is intentionally absent from public package guidance. Publishing old or unscanned `latest` images would be misleading, so registry publication remains gated.

## External preflight status

### Supabase

The 2026-07-11 `infra/scripts/supabase-preflight.ps1` run stopped before mutation because `SUPABASE_ACCESS_TOKEN` is absent from the secure CLI environment. It also requires a visible `SUPABASE_PROJECT_REF`, non-local pooled `DATABASE_URL`, and direct `DIRECT_URL`. OAuth/MCP access is not treated as a substitute for CLI migration credentials.

### Vercel

Project settings are visible, but production env preflight reports:

- API missing `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, Supabase service/JWT/KYC values, KYC limits, Maps/routing, DeepSeek, SePay, webhook, SMTP, FCM, and Twilio production values.
- Admin missing `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Restaurant missing `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Secret values are intentionally never printed or stored in this report. Any DeepSeek key previously pasted in chat is exposed and must be rotated, even if the same value was later added to a dashboard.

### GitHub Actions

The user reports billing/token/auth exhaustion. No local result may be represented as fresh remote CI. Required workflows include CI, Build, Lint, Mobile, E2E, Integration, OpenAPI, Gitleaks, CodeQL, Trivy, and SBOM.

## Remaining release gates

1. Complete critical-page visual/i18n/axe review and recapture media only if accepted UI changes require it.
2. Run fresh frozen installs and complete backend/web/mobile suites and signed-build checks at the final source head.
3. Validate private KYC Storage/RLS/upload/review behavior against the target Supabase project.
4. Run Chromium + Firefox full E2E, axe serious/critical, visual, tenant isolation, realtime authorization, shipper route/map, export, payment, and AI fail-closed/live smoke.
5. Rotate exposed keys and complete Supabase/Vercel secure preflights.
6. Restore remote CI and obtain green current-head workflow evidence.
7. Deploy Supabase, then Vercel API, Admin, and Restaurant; verify production health and behavior.
8. Fast-forward `HEAD` to `master`, publish immutable Docker manifests, and only then manually promote `latest`.

## Release decision

**NO-GO** at this snapshot. The repository is materially hardened, remote branch cleanup is complete, and mobile realtime parity has landed, but production credentials, final current-head gates, remote CI, provider deployment, signed mobile release evidence, and production smoke are mandatory and unresolved. No secret should be invented, copied from chat, committed, or bypassed to change this decision.
