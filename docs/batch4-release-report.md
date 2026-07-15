# FoodFlow Batch 4 Release Report

## Current production certification update — 2026-07-15

Current `origin/master` is `545d1beb30aa90b6890d952f1195f9b538912177`. Ten successful workflows are recorded for this exact SHA: Docker Publish, Gitleaks, Lint, Build Check, Trivy, SBOM, CodeQL, CI, Integration Smoke Gate, and E2E. No Mobile CI or OpenAPI Validate run is recorded for this SHA. Fresh local backend checks on the current working tree passed lint, typecheck, build, and 145 Jest suites / 1071 tests; docs links, 144 confirmed config keys, manifest JSON, and migration fresh-database checks also passed.

Vercel automatically deployed Admin and Restaurant from `429e237`; Railway API/worker remain on `52f4336`. The current remote head, Vercel, and Railway therefore represent three different revisions. The working tree still contains the migration checksum guard and deployment-guide corrections; these changes require a clean commit, fresh CI, and exact-revision deployment smoke before they may be treated as production artifacts.

Both canonical Vercel `/api/healthz` endpoints return the `429e237` revision. The capture manifest records public Chrome checks at 1536×826 and 390×844 with correct Vietnamese document metadata, accessible form names, no horizontal overflow, no missing image alt attributes, and no Restaurant login-page console warning/error. These are public login and responsive-layout checks only, not authenticated role certification.

Railway API/worker remain on the earlier immutable backend image from `52f433641d5093f6d064cfba6c1cd99c8cb035e9`. API health/readiness are 200 and database, Redis, and Storage are up, but the deployed image predates the revision field and returns `revision: null`. The frontend/backend split therefore blocks release promotion.

Supabase is healthy on PostgreSQL 17.6 with 38 effective finished migrations and three rolled-back records. Three already-applied migration files have checksums that do not match production history: `20260709143000_add_realtime_outbox`, `20260709150000_add_job_outbox`, and `20260712143000_add_production_storage_bucket`. No matching source was found in Git history or the eight local stashes. Do not use `prisma migrate resolve` to conceal this provenance gap. The first production attempt of the new cleanup migration failed closed because the Railway role cannot lock Supabase-owned `storage.vector_indexes`; no bucket or application data was changed. Recovery commit `c19fbfe` now deletes legacy buckets only through the Supabase Storage API (which rejects non-empty buckets), resolves only that failed migration, then verifies the end-state before applying the two PostGIS GiST indexes.

Production contains no Auth/application users, so authenticated Admin, Restaurant, Customer, Driver, private Storage, Realtime refresh/deny, controlled FCM, and device background-location journeys cannot be certified without approved controlled accounts/devices. The current decision remains **NO-GO**. No Railway deployment, database migration, semver image promotion, `latest` promotion, or GitHub Release was performed during this audit.

> **Historical snapshot — 2026-07-12.** The test counts, 27-migration result, image digests, and media QA statements below are evidence recorded for that date. They are not a claim about the current `master` head, the current dirty workspace, or production readiness.

## Current local and provider-status update — 2026-07-14

Runtime candidate `52f433641d5093f6d064cfba6c1cd99c8cb035e9` passed 144 Jest suites / 1065 tests, typecheck, lint, the Nest build, and every GitHub workflow triggered for the SHA. Docker Publish run `29336146675` passed multi-architecture runtime smoke and all eight High/Critical Trivy scans. The earlier clean-volume `foodflow-batch4-e2e` stack applied all 38 migrations and passed Playwright 204/204; that remains bounded local evidence.

Railway migrate deployment `a9002614-ed2a-438c-9a4e-7170954052fc` completed successfully and reported 38 migrations with none pending. API deployment `4e51ae50-1218-4c1b-a315-3c31ddf6de5c` and worker deployment `4f818c68-ce66-4aab-ae6e-f8ed708b4f91` are `SUCCESS` from immutable SHA images. `https://foodflow-api-production.up.railway.app/api/healthz` returns HTTP 200 with `status: ok`, and `/api/readyz` returns HTTP 200 with `ready: true`; database, Redis, and Supabase Storage are up. Worker logs show the 1000 ms PostgreSQL outbox poll, disabled RAG synchronization, and `FoodFlow Worker started`. Both services use explicit fail-closed `FOODFLOW_PROCESS_ROLE` values.

Supabase Storage readiness uses the project `service_role` JWT supplied by Supabase. The opaque `sb_secret...` credential is not used as the Storage Bearer token; no credential value is printed or committed. A controlled production smoke created temporary driver/admin identities, obtained a five-minute scoped ES256 realtime token, submitted simulated HCMC GPS through the authenticated Railway API, received the private `admin:drivers` Broadcast, and verified the PostGIS history row in 1437 ms. Temporary database rows and the Redis active-driver entry were removed; final checks reported zero production users and zero location-history rows. The diff from that GPS smoke candidate to `52f4336` changes only process startup/config validation and PowerShell probes, not tracking or realtime code.

Current Vercel deployments `dpl_5Yf8yfg8HPvQ8zHxww8AET9Cx5i9` (Admin) and `dpl_2AsBkXimCVh7BE6BLrHfDc4E1Bxa` (Restaurant) are Ready for the runtime-candidate push; their canonical health and localized login routes return 200. `RAG_ENABLED=false` is intentional because no DeepSeek credential is configured. Without Google Directions or an owned OSRM service, route requests return `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` while API/worker stay healthy. The release decision remains **NO-GO** because controlled-device FCM, authenticated browser role journeys, the background-location device matrix, and configured FCM/SMTP/Twilio/SePay/DeepSeek/owned-routing smoke remain incomplete.

| Artifact | SHA manifest digest (Docker Hub = GHCR) |
| --- | --- |
| `foodflow-backend` | `sha256:6d56cbefe7e9644703d957ae7a1abe96966d831b2567172edafc3063fc2e1f10` |
| `foodflow-migrate` | `sha256:f5131517198105f466ebb3daf2d52d5d56541f6b97dc0ec2cb99936e85e73f43` |
| `foodflow-admin` | `sha256:481bf07929b66cd8a23ab9d4ed95f37f585e78c868af3bacd49b6186b26bcfe6` |
| `foodflow-restaurant` | `sha256:38c35c1470152cb42debdf284444572e2d2127e42d71939384b804cbe1e1fa1f` |

## Local fresh-stack evidence — 2026-07-14

At local `master` `eb598c7b7da40f122901a866e35050f3a2e98c1c`, the rebuilt clean-volume Docker project `foodflow-batch4-e2e` exited its migrator successfully after all 36 migrations. It seeded 201 users, 50 restaurants, 352 menu items, 509 orders, and 123 reviews; the worker indexed 402 RAG documents. Playwright reported 204 expected, 0 unexpected, 0 flaky, and 0 skipped across Chromium, Firefox, and Pixel 5 in 353316 ms. On the same source, `flutter analyze` completed with no issues and the full Customer/Driver suite passed 361 tests. This is isolated local fresh-stack evidence, not production migration, deployment, provider, registry, or FCM-delivery proof.

A later Android API 35 device smoke on the same head plus uncommitted mobile fixes authenticated Customer and Driver against the isolated local stack. Customer loaded nearby seed restaurants from simulated GPS. Driver entered Online, started the Android location foreground service and notification, submitted an accepted authenticated location update, persisted the final PostGIS snapshot, then returned Offline with the service stopped and database online flag false. Privacy-reviewed stills are indexed in `docs/screenshots/manifest.json`; the manifest marks this as dirty-workspace regression evidence. It does **not** prove Supabase Broadcast, Railway, or production GPS.

The final clean-volume stack and Supabase production now both contain all 38 ordered migrations. Before the production change, the `public` schema and data were dumped outside the repository with SHA-256 checksums. The authorized Railway migrator applied migrations 37–38, `prisma migrate status` reports the schema up to date, the database UUID default is present, and `addresses_one_default_per_user_key` rejects a second default address for the same user.

The provider, workflow, Vercel, Railway, and registry statements that follow were rechecked on 2026-07-14. They are bounded external evidence and must not be read as end-to-end production approval.

The external provider evidence confirms 38 forward migrations, the `token,registration_id` primary key, scoped private Broadcast authorization, split public/private Storage buckets, and empty production business/RAG tables. Direct authorization smoke denied a cross-user channel; the authenticated Railway GPS smoke received the allowed private Broadcast and persisted PostGIS history. Current Vercel deployments are Ready and their health/login routes pass, while authenticated browser role journeys remain pending.

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

Railway OAuth and topology preflight pass for `foodflow-api`, `foodflow-worker`, `foodflow-migrate`, and managed Redis. Migrate deployment `a9002614-ed2a-438c-9a4e-7170954052fc`, API deployment `4e51ae50-1218-4c1b-a315-3c31ddf6de5c`, and worker deployment `4f818c68-ce66-4aab-ae6e-f8ed708b4f91` are successful from the `52f4336` SHA images. Health/readiness and worker polling pass. Optional integrations do not block process startup, but each integration fails closed when invoked without valid configuration.

Both Vercel projects are connected to the GitHub repository. Current production deployments `dpl_5Yf8yfg8HPvQ8zHxww8AET9Cx5i9` and `dpl_2AsBkXimCVh7BE6BLrHfDc4E1Bxa` are Ready; canonical `/api/healthz` and localized login routes return 200. Production variables use the canonical Railway URL, Supabase provider/project, publishable key, OpenFreeMap style, and no `trycloudflare.com` value. Authenticated browser role journeys remain pending; the API-level authenticated GPS/Broadcast/PostGIS path is verified.

Secret values are intentionally never printed or stored in this report. Any DeepSeek key previously pasted in chat is exposed and must be rotated, even if the same value was later added to a dashboard.

### GitHub Actions

Every workflow triggered for `52f4336` completed successfully: CI, Build, Lint, E2E, Integration Smoke Gate, Gitleaks, CodeQL, Trivy, SBOM, and Docker Publish. Docker Publish built matching Docker Hub/public-GHCR multi-architecture manifests, ran backend/migrator/web runtime smoke on clean hosted runners, and completed eight architecture-specific High/Critical scans. The SHA-only run intentionally did not promote semver or `latest`.

## Remaining release gates

1. Validate realtime token expiry/refresh, KYC private Storage upload/read, order GPS snapshot/delta/reconnect, and degraded route behavior against Supabase production.
2. Configure only integrations being certified, through sealed stores; smoke owned routing, export, SePay, SMTP/Twilio, DeepSeek, and one controlled-device FCM delivery. Do not fabricate Google Maps or any other provider value.
3. Run authenticated Customer/Driver/Restaurant/Admin browser or device journeys against the exact current deployments.
4. Complete the Android background-location matrix and authorized macOS/iPhone evidence.
5. Create semver and manually promote `latest` only after the remaining production smoke passes.

## Release decision

The 2026-07-14 decision remains **NO-GO for full certification**. Immutable images, Railway health, Supabase migration/Storage, Vercel health/login, and the authenticated API-level GPS/Broadcast/PostGIS path are verified. Full approval still requires authenticated browser role journeys, controlled FCM delivery, Android/iOS background-location device evidence, KYC private-object smoke, and any optional integration included in the certified feature set. No secret, seed, ETA, provider answer, or embedding may be invented or bypassed to change that decision.
