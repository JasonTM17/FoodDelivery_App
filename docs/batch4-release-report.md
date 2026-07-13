# FoodFlow Batch 4 Release Report

> **Historical snapshot — 2026-07-12.** The test counts, 27-migration result, image digests, and media QA statements below are evidence recorded for that date. They are not a claim about the current `master` head, the current dirty workspace, or production readiness.

Snapshot date: **2026-07-12**. Status at that snapshot: **integration pushed to `master`; production release blocked**.

## Release identity

| Item | Snapshot value |
|---|---|
| Remote repository | `JasonTM17/FoodDelivery_App` (private) |
| Remote branches | `master` only |
| Remote head | `origin/master@714d908ecab099876f5795a96ab6d0d6bca38514` |
| Release branch | `master` |
| Integration branch | `codex/batch4-integration` is an ancestor of `master` |
| Ahead/behind | `0 / 0` after the controlled fast-forward |
| Planned release | `v4.0.0` after all gates |
| Production deployment | Not completed |

The local branch had not been pushed by name because that would recreate a second remote branch. At the snapshot, final integration used a direct fast-forward `HEAD:master` after release approval.

## Later repository disposition — 2026-07-13

This report remains historical. A later 2026-07-13 audit found the remote has only `master`; no historical local integration/finalization ref or linked integration worktree remains. Branch equivalence is not a production-release claim.

The continued pass applied all 33 migrations to a fresh PostGIS + pgvector database and to Supabase production. The two latest committed migration checksums exactly match Supabase, and production business/RAG tables remain empty by design; no demo/big seed was run there. A disposable local database separately completed the real big-seed path with 50 approved restaurants, 50 drivers, 100 customers, 509 orders, 123 reviews, and 10 promotions. Its worker indexed 32 live restaurant/menu documents and, without a DeepSeek key, correctly left all embeddings pending instead of inserting fake vectors. Browser E2E against the older Docker image passed 128/134 checks, while six checks require a rebuilt current navigation image and isolated test seed.

Current scoped quality evidence is Backend 138 suites / 1016 tests, Admin 195 tests, Restaurant 134 tests, Prisma validation/generation, backend/web typecheck and lint, and both dashboard production builds. These counts remain bounded evidence, not production approval.

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
- Historical product media was generated from an isolated stack, not a stale production alias; it needs a fresh, source-identified capture before it can support current-release documentation.

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

## Historical local evidence

The values below preserve the 2026-07-12 evidence record. They distinguish then-current-line checks from broader historical runs; neither is release approval for a later final head.

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
| Documentation media | 20 Admin/Restaurant screenshots and two optimized GIFs captured through the seeded API. The manifest does not record a source SHA, so this is historical media only. |
| Driver GPS focused local E2E | Full Flutter analyze and 312 tests passed. Android API 35 Driver debug flavor prompted notification permission on explicit Online, ran a location foreground service, accepted a simulated GPS command, refreshed Redis liveness, persisted to PostGIS within seconds, and delivered one authorized Admin Socket.IO event. This is not Supabase or production evidence. |

A fresh full backend Prisma/typecheck/lint/Jest/build gate, full web/mobile builds, complete cross-page visual/axe suite, production-like tenant/realtime/map/KYC/AI smoke, and all remote workflows are still required before release. Historical counts are not substituted for those final gates.

## Historical product-media QA finding

The first capture used `127.0.0.1`, correctly triggered the isolated stack's CORS fail-closed behavior, and was discarded. The historical recapture through the configured `localhost` origin loaded seeded API data.

Visual review found Vietnamese Admin overview KPI labels rendered in English and two serious contrast failures. Commit `7ab9633` localized KPI labels by stable metric key, made URL locale authoritative for the Admin root, and hardened semantic color tokens. The recorded vi/en/ja Chromium and Firefox checks passed with conflicting cookies and axe serious/critical = 0; this is historical QA, not evidence for the current source head or the current product media.

## Registry audit

Docker Hub was verified on 2026-07-12 from the immutable SHA tags after a local build, pull, and runtime health smoke:

| Artifact | Candidate tag | Verified digest | Status |
|---|---|---|---|
| `foodflow-backend` | `sha-a627b597796965f4b991a5ab236a1fdedafa0b30` | `sha256:1e16888fa61ca5816d44011237858b71e9a49898af373ce74d05a68b9e71aa41` | Docker Hub SHA pulled and runtime returned health 200 as uid 65534; Docker Scout Linux/amd64 High/Critical = 0; `latest` intentionally retained on the prior candidate |
| `foodflow-migrate` | `sha-a627b597796965f4b991a5ab236a1fdedafa0b30` | `sha256:f6088d0455fa55aff01eb5067225eb1b9f14044b5aae2bf6e2ee424aaf024fec` | Docker Hub SHA pulled and runtime preserved uid 65532; Docker Scout Linux/amd64 High/Critical = 0; `latest` intentionally retained on the prior candidate |
| `foodflow-admin` | not published at current head | — | blocked: verified Supabase anon public build variable missing |
| `foodflow-restaurant` | not published at current head | — | blocked: verified Supabase anon public build variable missing |
| `foodflow-worker` | no separate artifact | backend digest | worker runs from backend image |

The two current SHA manifests are local Linux/amd64 release-candidate evidence, not a production release. No `v4.0.0` tag was created and `latest` was not promoted. Semver/latest promotion remains gated on multi-architecture image scanning, all application gates, provider preflight, deployment, and production smoke.

## External preflight status

### Supabase

The active Food_Delivery_Crab project was backed up outside the repository, then reconciled after the provider recorded a zero-step failed migration whose HNSW index already existed from the preceding migration. The failed entry was marked rolled back with Prisma's migration-history command; no applied SQL was reversed. `prisma migrate deploy` then applied the remaining forward migration. Prisma now reports 33 migrations and an up-to-date schema. PostGIS/pgvector indexes and the latest committed checksums were verified directly. Production users, restaurants, orders, driver profiles, and RAG documents remain 0 rows. The Supabase CLI token is not persisted in this worktree; a fresh CLI preflight still needs an authenticated shell session.

### Railway and Vercel

Railway OAuth and topology preflight pass for `foodflow-api`, `foodflow-worker`, `foodflow-migrate`, and managed Redis. The public API endpoint still returns 404 because API/worker rollout remains blocked by exactly 15 missing real provider configurations: `GOOGLE_MAPS_API_KEY`, `OSRM_URL`, `DEEPSEEK_API_KEY`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_NAME`, `SEPAY_WEBHOOK_SECRET`, `WEBHOOK_SECRET`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `FCM_PROJECT_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Production validation remains fail-closed; no value was fabricated.

Both Vercel projects pass the committed settings/environment-name preflight and their canonical health endpoints return 200 JSON. Admin and Restaurant production builds pass with verified public values. A clean Restaurant candidate from exact source `9db6f7e` reached READY and passed its protected `/api/healthz` through the Vercel CLI bypass, but it was intentionally not promoted while Railway health/auth/GPS smoke is impossible. Admin still needs an equivalent final-source candidate after the release source SHA is frozen.

Secret values are intentionally never printed or stored in this report. Any DeepSeek key previously pasted in chat is exposed and must be rotated, even if the same value was later added to a dashboard.

### GitHub Actions

The user reports billing/token/auth exhaustion. No local result may be represented as fresh remote CI. Required workflows include CI, Build, Lint, Mobile, E2E, Integration, OpenAPI, Gitleaks, CodeQL, Trivy, and SBOM.

## Remaining release gates

1. Supply/rotate the 15 missing Railway provider configurations only through sealed provider stores; pass strict API/worker environment validation.
2. Run the current-head migrator, deploy Railway API/worker, and require `/api/healthz` plus `/api/readyz` before any web promotion.
3. Validate private Broadcast token expiry/refresh, RLS cross-tenant denial, KYC Storage upload/read, and GPS snapshot/delta delivery against Supabase production.
4. Run current-SHA Chromium + Firefox E2E, axe serious/critical, visual, tenant isolation, route/map, export, payment, notification, and AI live smoke.
5. Complete full final-head Flutter tests/release builds and Android device GPS matrix; use macOS/iPhone for the required iOS background-location evidence.
6. Restore remote CI and obtain green final-head workflow evidence.
7. Smoke and promote the exact Admin/Restaurant Vercel candidates only after Railway is healthy.
8. Build/push all four current-head Docker SHA manifests, pull them in a clean environment, verify remote digests/scans/runtime smoke, then create semver and manually promote `latest` only after production smoke.

## Release decision

**NO-GO** remains correct. Supabase schema deployment is complete and the dashboard candidates/builds are healthy, but Railway API/worker are not live, 15 provider configurations are missing, production GPS/Broadcast/FCM/auth smoke has not run, final-head remote CI/mobile release evidence is incomplete, and current-head Docker images have not been published. No secret, seed, ETA, provider answer, or embedding may be invented or bypassed to change this decision.
