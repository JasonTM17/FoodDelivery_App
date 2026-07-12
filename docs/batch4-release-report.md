# FoodFlow Batch 4 Release Report

Last updated: **2026-07-12**. Status: **integration pushed to `master`; production release blocked**.

## Release identity

| Item | Current value |
|---|---|
| Remote repository | `JasonTM17/FoodDelivery_App` (private) |
| Remote branches | `master` only |
| Remote head | `origin/master@714d908ecab099876f5795a96ab6d0d6bca38514` |
| Release branch | `master` |
| Integration branch | `codex/batch4-integration` is an ancestor of `master` |
| Ahead/behind | `0 / 0` after the controlled fast-forward |
| Planned release | `v4.0.0` after all gates |
| Production deployment | Not completed |

The local branch has not been pushed by name because that would recreate a second remote branch. Final integration is a direct fast-forward `HEAD:master` after release approval.

## Landed hardening

### Backend and data

- Provider-selectable Supabase Realtime, Storage, and PostgreSQL job outbox with fail-closed production validation.
- `POST /api/realtime/token` issues five-minute Supabase JWTs only after order/restaurant ownership checks and returns explicit channel names.
- `realtime_outbox` RLS permits authenticated reads only when the row channel is present in JWT claims; only that table is added to the explicit Supabase Realtime publication.
- `GET|POST /api/jobs/drain` requires `CRON_SECRET`; the Railway worker owns recurring persisted job-outbox drains and the endpoint is the authenticated recovery path.
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
| Backend current-line | Prisma validate/generate, typecheck, lint, build, and all 129 Jest suites / 972 tests passed at `1f761a6`. |
| Database current-line | Fresh isolated PostGIS applied all 27 migrations; payment receipt/refund, job dedupe, RLS, and unique-index invariants were verified. |
| Mobile current-line | Flutter analyze and all 274 tests passed; the real `lib/main_driver.dart` entry built a Driver debug APK. |
| Admin/OpenAPI current-line | Shared API client + Admin typecheck passed, KYC modal 5/5 passed, and Spectral reported no errors. |
| Web historical | Admin/Restaurant typecheck/lint, 305 Vitest tests, and 70/55 localized production pages passed before the latest KYC/docs commits. Rerun required. |
| Browser/a11y historical | Contract 18/18 plus locale/cookie 6/6 passed across Chromium/Firefox; focused axe serious/critical = 0. Full cross-page rerun required. |
| Docker current-line | Backend and migrate were published from `1f761a6` to Docker Hub and repository-linked GHCR packages; both registries resolve to identical `amd64`/`arm64` manifest digests with SBOM/provenance. Current-head Trivy/runtime smoke is still required. |
| Workflow/config historical | Actionlint, Compose configs, and the local release mini-gate passed before current head. Rerun required. |
| Secret hygiene | The staged scan for `924808c` found no live token/private key; real dotenv files remained untracked. A full final-head Gitleaks scan is still required. |
| Documentation media | 20 current-source Admin/Restaurant screenshots and two optimized GIFs captured through the real seeded API. |

A fresh full backend Prisma/typecheck/lint/Jest/build gate, full web/mobile builds, complete cross-page visual/axe suite, production-like tenant/realtime/map/KYC/AI smoke, and all remote workflows are still required before release. Historical counts are not substituted for those final gates.

## Product-media QA finding

The first capture used `127.0.0.1`, correctly triggered the isolated stack's CORS fail-closed behavior, and was discarded. Recapture through the configured `localhost` origin loaded real seeded API data.

Visual review found Vietnamese Admin overview KPI labels rendered in English and two serious contrast failures. Commit 7ab9633 localized KPI labels by stable metric key, made URL locale authoritative for the Admin root, and hardened semantic color tokens. Fresh vi/en/ja Chromium and Firefox checks passed with conflicting cookies and axe serious/critical = 0; the accepted media was then recaptured from that build.

## Registry audit

Docker Hub and GHCR were verified on 2026-07-11:

| Artifact | Candidate tag | Verified digest | Status |
|---|---|---|---|
| `foodflow-backend` | `sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0` | `sha256:399cc6a03ab5b582c4b771ac3b93711d5a823f9dc83c146e932b8ffdf6cd8ed0` | Docker Hub/GHCR digest match; linked to repository |
| `foodflow-migrate` | `sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0` | `sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756` | Docker Hub/GHCR digest match; linked to repository |
| `foodflow-admin` | not published at current head | — | blocked: verified Supabase anon public build variable missing |
| `foodflow-restaurant` | not published at current head | — | blocked: verified Supabase anon public build variable missing |
| `foodflow-worker` | no separate artifact | backend digest | worker runs from backend image |

The two current SHA manifests are release-candidate evidence, not a production release. No `v4.0.0` tag was created and `latest` was not changed. Semver/latest promotion remains gated on current-head image scanning, all application gates, provider preflight, deployment, and production smoke.

## External preflight status

### Supabase

The project is linked and visible to the authenticated Supabase CLI account, but the remote database connection used by `supabase migration list --linked` timed out. No remote migration, schema dump, RLS advisor, or Storage change was attempted after that failure. Complete a non-local session/direct connection check and backup before rerunning the preflight; OAuth/CLI access is not a substitute for database connectivity.

### Railway and Vercel

Railway CLI 5.26.0 is installed but `railway whoami --json` returns `Unauthorized. Please login with railway login`; no Railway project or service was created. The required production topology remains API, worker, migrator, and managed Redis.

Vercel remains limited to Admin and Restaurant. Their public build contract now requires `NEXT_PUBLIC_API_URL` for the future Railway domain and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; no production redeploy was attempted.

Secret values are intentionally never printed or stored in this report. Any DeepSeek key previously pasted in chat is exposed and must be rotated, even if the same value was later added to a dashboard.

### GitHub Actions

The user reports billing/token/auth exhaustion. No local result may be represented as fresh remote CI. Required workflows include CI, Build, Lint, Mobile, E2E, Integration, OpenAPI, Gitleaks, CodeQL, Trivy, and SBOM.

## Remaining release gates

1. Complete critical-page visual/i18n/axe review and recapture media only if accepted UI changes require it.
2. Run fresh frozen installs and complete backend/web/mobile suites and signed-build checks at the final source head.
3. Validate private KYC Storage/RLS/upload/review behavior against the target Supabase project.
4. Run Chromium + Firefox full E2E, axe serious/critical, visual, tenant isolation, realtime authorization, shipper route/map, export, payment, and AI fail-closed/live smoke.
5. Rotate exposed keys and complete Supabase/Railway/Vercel secure preflights.
6. Restore remote CI and obtain green current-head workflow evidence.
7. Deploy Supabase, then Railway migration/API/worker/Redis, then Vercel Admin and Restaurant; verify production health and behavior.
8. Pull the existing immutable Docker Hub SHA in a clean environment, publish a matching semver only after the smoke, and then manually promote `latest`.

## Release decision

**NO-GO** at this snapshot. The repository is materially hardened, `master` contains the integration, Docker Hub SHA images are pushed, and mobile realtime parity has landed, but Supabase database connectivity, Railway authentication/service setup, production secrets, remote CI, signed mobile release evidence, and production smoke are mandatory and unresolved. No secret should be invented, copied from chat, committed, or bypassed to change this decision.
