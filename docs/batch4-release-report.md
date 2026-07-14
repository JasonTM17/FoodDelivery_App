# FoodFlow Batch 4 Release Report

> **Historical snapshot — 2026-07-12.** The test counts, 27-migration result, image digests, and media QA statements below are evidence recorded for that date. They are not a claim about the current `master` head, the current dirty workspace, or production readiness.

## Current local and provider-status update — 2026-07-14

Local `master` and `origin/master` resolve to `ed25399298c01975c7943ff967d4178e0ceafdfa`. The current clean-volume `foodflow-batch4-e2e` stack applied all 38 migrations; a transaction check proved that the database rejects a second default address for the same user. With explicit local public URLs, the rebuilt stack passed Playwright Chrome desktop 68/68 (173.0 s), Firefox 68/68 (172.9 s), and Pixel 5 mobile Chrome 68/68 (117.3 s): 204/204, no failures or skips. Direct Google Chrome checks found the public Admin and Restaurant sign-in pages usable at desktop width, and the Restaurant page had no horizontal overflow at Pixel 5 width. This is current local evidence only; it does not validate a provider deployment.

The current read-only Railway status query found `foodflow-api`, `foodflow-worker`, and `foodflow-migrate` offline. The public API health URL returned HTTP 404. The isolated local API and worker intentionally have no FCM project or Firebase credential configured; therefore no real FCM send was attempted. Deploy the exact release candidate with sealed Firebase credentials (or workload identity) and a controlled-device token before recording a live FCM result. The release decision remains **NO-GO**.

## Local fresh-stack evidence — 2026-07-14

At local `master` `eb598c7b7da40f122901a866e35050f3a2e98c1c`, the rebuilt clean-volume Docker project `foodflow-batch4-e2e` exited its migrator successfully after all 36 migrations. It seeded 201 users, 50 restaurants, 352 menu items, 509 orders, and 123 reviews; the worker indexed 402 RAG documents. Playwright reported 204 expected, 0 unexpected, 0 flaky, and 0 skipped across Chromium, Firefox, and Pixel 5 in 353316 ms. On the same source, `flutter analyze` completed with no issues and the full Customer/Driver suite passed 361 tests. This is isolated local fresh-stack evidence, not production migration, deployment, provider, registry, or FCM-delivery proof.

A later Android API 35 device smoke on the same head plus uncommitted mobile fixes authenticated Customer and Driver against the isolated local stack. Customer loaded nearby seed restaurants from simulated GPS. Driver entered Online, started the Android location foreground service and notification, submitted an accepted authenticated location update, persisted the final PostGIS snapshot, then returned Offline with the service stopped and database online flag false. Privacy-reviewed stills are indexed in `docs/screenshots/manifest.json`; the manifest marks this as dirty-workspace regression evidence. It does **not** prove Supabase Broadcast, Railway, or production GPS.

The final clean-volume stack and Supabase production now both contain all 38 ordered migrations. Before the production change, the `public` schema and data were dumped outside the repository with SHA-256 checksums. The authorized Railway migrator applied migrations 37–38, `prisma migrate status` reports the schema up to date, the database UUID default is present, and `addresses_one_default_per_user_key` rejects a second default address for the same user.

The provider, workflow, Vercel, Railway, and registry statements that follow were rechecked on 2026-07-14. They are bounded external evidence and must not be read as end-to-end production approval.

The external provider evidence confirms 38 forward migrations, the `token,registration_id` primary key, scoped private Broadcast authorization, split public/private Storage buckets, and empty production business/RAG tables. An ES256 five-minute token subscribed to its allow-listed private channel, a cross-user channel was denied, and a REST Broadcast was received. Both Vercel dashboards are READY for `ed25399`; Railway API/worker remain blocked by 15 missing real-provider configurations.

The registry evidence covers four immutable multi-architecture manifests for `ed25399` on Docker Hub and public GHCR. Repository Actions write access and source links are configured on every package. No `v4.0.0` or `latest` promotion is authorized by that record.

Snapshot date: **2026-07-12**. Status at that snapshot: **integration pushed to `master`; production release blocked**.

## Release identity

| Item                  | Snapshot value                                           |
| --------------------- | -------------------------------------------------------- |
| Remote repository     | `JasonTM17/FoodDelivery_App` (public)                    |
| Remote branches       | `master` only                                            |
| Remote head           | `origin/master@714d908ecab099876f5795a96ab6d0d6bca38514` |
| Release branch        | `master`                                                 |
| Integration branch    | `codex/batch4-integration` is an ancestor of `master`    |
| Ahead/behind          | `0 / 0` after the controlled fast-forward                |
| Planned release       | `v4.0.0` after all gates                                 |
| Production deployment | Not completed                                            |

The local branch had not been pushed by name because that would recreate a second remote branch. At the snapshot, final integration used a direct fast-forward `HEAD:master` after release approval.

## Later repository disposition — 2026-07-13

This report remains historical. A later 2026-07-13 audit found the remote has only `master`; no historical local integration/finalization ref or linked integration worktree remains. Branch equivalence is not a production-release claim.

The continued pass applied all 33 migrations to a fresh PostGIS + pgvector database and to Supabase production. The two latest committed migration checksums exactly match Supabase, and production business/RAG tables remain empty by design; no demo/big seed was run there. A disposable local database separately completed the real big-seed path with 50 approved restaurants, 50 drivers, 100 customers, 509 orders, 123 reviews, and 10 promotions. Its worker indexed 32 live restaurant/menu documents and, without a DeepSeek key, correctly left all embeddings pending instead of inserting fake vectors. Browser E2E against the older Docker image passed 128/134 checks, while six checks require a rebuilt current navigation image and isolated test seed.

Current scoped quality evidence is Backend 138 suites / 1016 tests, Admin 195 tests, Restaurant 134 tests, Prisma validation/generation, backend/web typecheck and lint, and both dashboard production builds. These counts remain bounded evidence, not production approval.

## Landed hardening

### Backend and data

- Provider-selectable Supabase Realtime, Storage, and PostgreSQL job outbox with fail-closed production validation.
- `POST /api/realtime/token` issues five-minute Supabase JWTs only after order/restaurant ownership checks and returns explicit channel names.
- The initial `realtime_outbox` publication was removed by migration `20260712161000_authorize_private_broadcast_and_split_storage`; the retained table is rollback history and is not published. Managed realtime uses server-side private Broadcast, with `realtime.messages` subscriptions limited by JWT `realtime_channels` claims.
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
- Managed Customer/Driver realtime uses scoped Supabase token/channel grants and allow-listed receive-only private Broadcast events; GPS and dispatch decisions remain authenticated REST mutations. `socket_io_client` is retained only for explicit local/self-hosted mode.
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

| Gate                         | Evidence                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend current-line         | Prisma validate/generate, typecheck, lint, build, and all 129 Jest suites / 972 tests passed at `1f761a6`.                                                                                                                                                                                                                                                              |
| Database current-line        | Fresh isolated PostGIS applied all 27 migrations; payment receipt/refund, job dedupe, RLS, and unique-index invariants were verified.                                                                                                                                                                                                                                   |
| Mobile current-line          | Flutter analyze and all 274 tests passed; the real `lib/main_driver.dart` entry built a Driver debug APK.                                                                                                                                                                                                                                                               |
| Admin/OpenAPI current-line   | Shared API client + Admin typecheck passed, KYC modal 5/5 passed, and Spectral reported no errors.                                                                                                                                                                                                                                                                      |
| Web historical               | Admin/Restaurant typecheck/lint, 305 Vitest tests, and 70/55 localized production pages passed before the latest KYC/docs commits. Rerun required.                                                                                                                                                                                                                      |
| Browser/a11y historical      | Contract 18/18 plus locale/cookie 6/6 passed across Chromium/Firefox; focused axe serious/critical = 0. Full cross-page rerun required.                                                                                                                                                                                                                                 |
| Docker current-line          | Backend and migrate were published from `1f761a6` to Docker Hub and repository-linked GHCR packages; both registries resolve to identical `amd64`/`arm64` manifest digests with SBOM/provenance. Current-head Trivy/runtime smoke is still required.                                                                                                                    |
| Workflow/config historical   | Actionlint, Compose configs, and the local release mini-gate passed before current head. Rerun required.                                                                                                                                                                                                                                                                |
| Secret hygiene               | The staged scan for `924808c` found no live token/private key; real dotenv files remained untracked. A full final-head Gitleaks scan is still required.                                                                                                                                                                                                                 |
| Documentation media          | 20 Admin/Restaurant screenshots and two optimized GIFs captured through the seeded API. The manifest does not record a source SHA, so this is historical media only.                                                                                                                                                                                                    |
| Driver GPS focused local E2E | Full Flutter analyze and 312 tests passed. Android API 35 Driver debug flavor prompted notification permission on explicit Online, ran a location foreground service, accepted a simulated GPS command, refreshed Redis liveness, persisted to PostGIS within seconds, and delivered one authorized Admin Socket.IO event. This is not Supabase or production evidence. |

A fresh full backend Prisma/typecheck/lint/Jest/build gate, full web/mobile builds, complete cross-page visual/axe suite, production-like tenant/realtime/map/KYC/AI smoke, and all remote workflows are still required before release. Historical counts are not substituted for those final gates.

## Historical product-media QA finding

The first capture used `127.0.0.1`, correctly triggered the isolated stack's CORS fail-closed behavior, and was discarded. The historical recapture through the configured `localhost` origin loaded seeded API data.

Visual review found Vietnamese Admin overview KPI labels rendered in English and two serious contrast failures. Commit `7ab9633` localized KPI labels by stable metric key, made URL locale authoritative for the Admin root, and hardened semantic color tokens. The recorded vi/en/ja Chromium and Firefox checks passed with conflicting cookies and axe serious/critical = 0; this is historical QA, not evidence for the current source head or the current product media.

## Registry audit

Docker Hub and public GHCR were queried on 2026-07-14 after the SHA-only workflow published evidence commit `ed25399298c01975c7943ff967d4178e0ceafdfa`:

| Artifact              | Candidate tag                                  | Verified digest                                                           | Status                                                                             |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `foodflow-backend`    | `sha-ed25399298c01975c7943ff967d4178e0ceafdfa` | `sha256:b1a24c929d7178548c407c019aa75347da78fe5c1dd135177f2b5e4024e4143b` | Docker Hub/GHCR multi-architecture indexes match; clean pull/runtime smoke pending |
| `foodflow-migrate`    | `sha-ed25399298c01975c7943ff967d4178e0ceafdfa` | `sha256:feb11569b66cb88cdeafbc92c3e64ca9eaed8801859f42f3600237eb55ad3bb4` | Docker Hub/GHCR multi-architecture indexes match; clean pull/runtime smoke pending |
| `foodflow-admin`      | `sha-ed25399298c01975c7943ff967d4178e0ceafdfa` | `sha256:43d8908d5a77efb7142744ce76ce6355631a3b406b5e8d5e6bed884a4ac02b12` | Docker Hub/GHCR multi-architecture indexes match; clean pull/runtime smoke pending |
| `foodflow-restaurant` | `sha-ed25399298c01975c7943ff967d4178e0ceafdfa` | `sha256:7ba5838752a699f7dd3fb46d98110b2b37ef0c6a53f6f21aa2493c9e398da97e` | Docker Hub/GHCR multi-architecture indexes match; clean pull/runtime smoke pending |
| `foodflow-worker`     | no separate artifact                           | backend digest                                                            | worker runs from backend image                                                     |

These four remote SHA manifests are registry evidence, not a production release. The workflow now refuses to overwrite a SHA tag when either registry is missing or their digests differ. No `v4.0.0` tag was created and `latest` was not promoted. Clean-pull/runtime smoke, provider deployment, and production smoke remain required.

## Historical external preflight status — recorded through 2026-07-14

The following provider observations are release-record evidence, not a current provider query from this checkout.

### Supabase

The active Food_Delivery_Crab project was backed up outside the repository, then reconciled after the provider recorded a zero-step failed migration whose HNSW index already existed from the preceding migration. The failed entry remains marked rolled back; no applied SQL was reversed. The authorized Railway migrate environment applied migrations 37–38 and production now has all 38 forward migrations applied. PostGIS/pgvector indexes, the address invariant/default, RLS, ES256 private Broadcast authorization, split Storage policies, empty production business/RAG tables, and the migration 36 primary key were verified directly. The Supabase CLI token and backup contents are not persisted in the worktree.

### Railway and Vercel

Railway OAuth and topology preflight pass for `foodflow-api`, `foodflow-worker`, `foodflow-migrate`, and managed Redis. The migrate service has no persistent deployment, but the authorized current-head one-off migrator/status command completed against Supabase. The public API endpoint still returns 404 because API/worker have no deployment and remain blocked by exactly 15 missing real provider configurations: `GOOGLE_MAPS_API_KEY`, `OSRM_URL`, `DEEPSEEK_API_KEY`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_NAME`, `SEPAY_WEBHOOK_SECRET`, `WEBHOOK_SECRET`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `FCM_PROJECT_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Production validation remains fail-closed; no value was fabricated.

Both Vercel projects are connected to the GitHub repository and their `ed25399` production deployments are READY. Canonical `/api/healthz` and localized login routes return 200. Production variables use the canonical Railway URL, Supabase provider/project, publishable key, OpenFreeMap style, and no `trycloudflare.com` value. Full auth/GPS smoke remains blocked until Railway API/worker are live.

Secret values are intentionally never printed or stored in this report. Any DeepSeek key previously pasted in chat is exposed and must be rotated, even if the same value was later added to a dashboard.

### GitHub Actions

All 11 required code-release workflows are green: CI, Build, Lint, Mobile CI, E2E, Integration Smoke Gate, Gitleaks, CodeQL, Trivy, OpenAPI Validate, and SBOM. Docker Hub and public GHCR expose all four matching `ed25399` SHA manifests. The SHA-only workflow has not promoted semver or `latest`.

## Remaining release gates

1. Supply/rotate the 15 missing Railway provider configurations only through sealed provider stores; pass strict API/worker environment validation.
2. Deploy Railway API/worker from one immutable SHA and require `/api/healthz` plus `/api/readyz`; rerun migration status as part of the current production preflight.
3. Validate private Broadcast token expiry/refresh, RLS cross-tenant denial, KYC Storage upload/read, GPS snapshot/delta/reconnect, and degraded route behavior against Supabase production.
4. Run provider-backed route/map, export, payment, notification, AI, and one controlled-device FCM smoke. Complete Android device GPS matrix and use macOS/iPhone for required iOS background-location evidence.
5. Re-smoke the exact Admin/Restaurant Vercel deployments after Railway is healthy.
6. Pull all four SHA manifests in a clean environment and verify scans/runtime smoke, then create semver and manually promote `latest` only after production smoke.

## Release decision

The 2026-07-14 external snapshot concluded **NO-GO**. A new release decision requires fresh provider preflight, API/worker health, controlled FCM delivery, device evidence, image pulls, and production smoke; no secret, seed, ETA, provider answer, or embedding may be invented or bypassed to change that decision.
