# FoodFlow Batch 4 Release Report

## Current production evidence — 2026-07-16

Runtime SHA `a703ece61e66dcfe7f308cbf46a98098983233e7` is the current deployed application revision. Docker Publish run `29474270122` reused the verified immutable manifests, passed four multi-architecture runtime smokes, eight architecture-specific Trivy scans, and production smoke, then promoted `v0.1.2` and `latest`. Release run `29477368072` revalidated the Git tag and registry digests from the same source SHA, generated the changelog and both SBOMs, and updated [GitHub Release v0.1.2](https://github.com/JasonTM17/FoodDelivery_App/releases/tag/v0.1.2). Railway migrate/API/worker deployments `49579ce7-9808-4a35-afcc-82432943bc70`, `9c823cd9-290a-4eb0-94a2-fdf01c3f0b06`, and `413dedcc-6ba7-46be-8c99-901f592c558f` report success; API health/readiness and Vercel deployments `dpl_7CFZKPxtNsYeF1Y6BZmnoJEoXyiF` and `dpl_6jqguNYtbVCMVaQ6GvikiceYVsGN` return this exact revision. Supabase has 41 effective migrations with none pending and healthy PostgreSQL/Redis/Storage.

The final production smoke authenticated temporary Admin/Driver accounts, verified five-minute ES256 realtime tokens, private Broadcast RLS allow/deny, accepted GPS fanout, one persisted PostGIS row, `poor_accuracy` and `driver_offline` rejection reasons, and complete DB/Redis cleanup. A read-only follow-up inventory found zero users, Customer/Driver/Restaurant profiles, restaurants, orders, and GPS rows. Admin health is public. Restaurant health was verified through authenticated Vercel access because its project uses `all_except_custom_domains` SSO protection and has no custom domain; unauthenticated requests redirect to Vercel SSO, so public Restaurant availability is not certified. Docker Hub and public GHCR `sha-a703ece...`, `v0.1.2`, and `latest` tags are digest-equal for backend, migrator, Admin, and Restaurant. GHCR semver/latest promotion is not claimed because manifest writes returned `401 Unauthorized`. Full device certification remains open for physical Android/iOS background-location, controlled FCM delivery, full authenticated browser role journeys, and optional providers included in certification scope.

Earlier manual release run `29413125555` passed preflight, all four runtime smokes, all eight image scans, and production smoke, then its promotion step exited before tagging. Idempotent recovery and the hardened retry path reused the already verified SHA images; no image was rebuilt. Final run `29474270122` completed promotion on both registries, and `29477368072` completed GitHub Release/SBOM publication. Digest conflicts and Docker Hub failures remain fail-closed; a transient GHCR authorization refusal is still reported without weakening Docker Hub validation.

The controlled four-role smoke and its Admin/Restaurant Chrome screenshots were captured earlier at SHA `17584153ff256b74a3413ae9844f4f27bff038cc`. It remains historical evidence for that exact revision, not authentication certification for current SHA `a703ece`. Candidate migration 42 and its hardened recovery controller remain undeployed pending PR review, backup, synchronized rollout, and post-deploy verification. Full certification remains open for current-revision four-role journeys, public Restaurant access, physical Android/iOS background location, controlled FCM delivery, active-order routing, and optional providers.

### Post-merge candidate gates — 2026-07-16

The reconciled branch contains current production history through `a703ece` plus the undeployed migration 42/controller hardening. Backend Prisma generate/validate, typecheck, ESLint, and Nest build pass. Full Jest reports 153 passing suites, one gated integration suite skipped, 1,160 passing tests, and one skipped test. The newly merged GPS/realtime/Redis tests pass 101/101; role-smoke unit tests pass 44/44. A fresh marked disposable PostGIS+pgvector database applied all 42 migrations, then the destructive role-smoke integration passed 1/1 and returned `users=0`, `restaurants=0`, and `smoke_runs=0`; the container was removed.

Flutter dependency lock resolution and analyze pass with no issues; the full Customer/Driver suite passes 373/373. Web frozen install, typecheck, lint, and Vercel build-selection tests pass; Admin passes 194/194 Vitest tests and builds 70 routes, while Restaurant passes 135/135 and builds 55 routes. Documentation validation checks 64 files with 691 working internal links and 148 confirmed config keys; its heuristic warnings remain non-blocking, and markdownlint reports 0 errors across 76 files. All four GIFs decode as animated media with 24, 35, 4, and 19 frames; manifest hashes match the production Admin/Restaurant PNGs, Android recovery WebP, and Customer GIF. The final staged secret scan and cached diff check pass.

### Historical Vercel revision drift and recovery — 2026-07-15

Documentation-only commits after SHA `17584153ff256b74a3413ae9844f4f27bff038cc` triggered newer Vercel production builds even though the Admin/Restaurant runtime inputs were unchanged. Railway stayed on SHA `17584153`, so the canonical web health revision temporarily differed from the API revision. The last verified SHA `17584153` builds were redeployed exactly: Admin `dpl_3Gm3hB31QJrrRq7QPSSQD9x2Wkgp` and Restaurant `dpl_8YVNGQCyWCzkCezeXYD1gKAb89CZ`. At that time, both canonical health endpoints returned the same full SHA as Railway. Public production smoke passed Admin and Restaurant login routes for `vi`, `en`, and `ja`; authenticated role journeys were intentionally skipped and are not certified by this recovery check.

Final recheck caught the same regression again after origin commit `2ff8bac4780c5bdd5418d37174859c329544f786`, whose only changed file is root `README.md`. Both Vercel health routes reported that docs-only SHA while Railway remained on `17584153`. The same verified Admin and Restaurant deployment IDs were promoted again without rebuilding. PR #80 later merged the docs-only deploy guard, and current API/ready plus both canonical web health routes now return exact SHA `a703ece61e66dcfe7f308cbf46a98098983233e7`.

### Historical controlled authenticated role smoke — SHA 17584153, 2026-07-15

The custom FoodFlow auth path—not Supabase Auth—created four exact `@example.invalid` fixture identities and one approved temporary restaurant. Google Chrome authenticated Admin to `/vi/overview` and Restaurant to its tenant-scoped `/vi/orders` queue; neither page emitted a console warning or error. Customer and Driver authenticated through the Railway API, loaded `/users/me`, their empty orders/earnings contracts, and Supabase Realtime credentials containing only private channels. Customer-to-Admin and Driver-to-Restaurant access attempts returned the expected denial.

Cleanup first made every fixture user inactive, then removed role profiles, the restaurant, and users. Reloading a cached shell alone did not call a protected API, so the stronger check navigated each retained Chrome session to a protected data route; both were redirected to login. Final direct inventory reported `0` users, `0` Customer/Driver/Restaurant profiles, `0` restaurants, `0` orders, and `0` driver-location rows.

An extra concurrent Prisma operation hit Supabase session-pool limit `15` with `EMAXCONNSESSION`; it failed before mutation. The owning fixture process retained its original connection and completed cleanup. The candidate controller now verifies Railway production, the Supabase project binding, `postgres.public`, and direct/session port `5432`; transaction-pool port `6543` is rejected. It requires a serializable zero user/restaurant/order/GPS preflight, forces `connection_limit=1`, binds the advisory lease to a live PostgreSQL backend PID, keeps the restaurant inactive/closed, and stores a non-secret exact-ID lifecycle record in the provisioning transaction. Cleanup locks and revalidates lifecycle plus fixture ownership, deletes by immutable UUID, atomically records `deletion_committed`, rejects unknown recovery runs, and reconciles uncertain provision results under a verified/reacquired lease. Realtime signing holds a shared active-user row lock; migration 42 adds restrictive creator/sender/approver/cart foreign keys after six explicit orphan preflights. Cleanup keeps the lease through the five-minute Realtime TTL plus five seconds, performs a second exhaustive residue scan, then records lifecycle completion. Cleanup errors are not retried. Local fault injection proved live-owner recovery rejection, lease release after forced kill, wrong-marker and dependent-row preservation, and final zero residue. The final disposable PostGIS regression applied all 42 candidate migrations and additionally proved a mistyped recovery run ID cannot report success, a swapped restaurant slug cannot delete either restaurant, an external cart pointing to the fixture restaurant blocks cleanup without deactivation, cleanup waits behind a shared user lock, a late support-macro creator insert fails its FK, post-delete recovery resumes from the durable tombstone, and exact cleanup returns all test rows to zero. A deliberate failure at migration 42's final index rolled back its earlier table, constraints, and indexes; the destructive integration requires a server-side disposable database marker and tears down only tracked UUIDs.

The historical production run issued five-minute Realtime JWTs but did not open Customer/Driver WebSockets; Admin/Restaurant Chrome was closed after protected-route revocation checks. Those credentials are long expired. Normal future runs require `CLEANUP_OK ... outcome=deleted`; interrupted post-delete recovery may report `outcome=already-deleted` only when the durable exact-ID lifecycle row matches. Closure of every Chrome/Realtime client during the drain window, `CAPABILITY_DRAIN_OK realtimeTokensExpired=true`, and `FINAL_RESIDUE_OK` remain mandatory. The deployed SHA still has 41 applied migrations; migration 42 and this controller hardening remain candidate changes until PR review, migration rollout, synchronized API/worker/web deployment, and post-deploy verification. Do not start extra Prisma clients during the controller lifecycle.

| Authenticated surface | Privacy-reviewed evidence |
| --- | --- |
| Admin | ![Admin authenticated production overview](screenshots/production/2026-07-15-admin-authenticated-overview.png) |
| Restaurant | ![Restaurant authenticated production orders](screenshots/production/2026-07-15-restaurant-authenticated-orders.png) |

This closes the bounded web-role authentication gap and proves Customer/Driver API auth, not native mobile UI. It does not create or certify an active order, route polyline, payment, export, AI answer, FCM delivery, Android/iOS background location, or optional provider flow. Full release certification remains **NO-GO** for those untested boundaries.

### Current Vercel exact-revision recovery — 2026-07-16

The final backend-only fix was intentionally skipped by each app's Vercel `ignoreCommand`. A 2.3 MB tracked-source staging archive removed only that command outside the repository, injected `BUILD_SHA=a703ece...`, and created non-aliased production deployments. Admin and Restaurant were promoted only after both were `Ready`; authenticated Vercel health returns the same full SHA as Railway. The release-time smoke recorded localized login pages and Chrome DOM forms, but the later public recheck redirects Restaurant to Vercel SSO, so public Restaurant availability is not claimed. The staging directory and temporary GPS script were deleted; the worktree returned clean before this report update.

## Historical candidate snapshot — superseded

Runtime code evidence is anchored at `f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b`; subsequent report-only commits do not change any backend/web/mobile or Docker build context. Ten successful workflows are recorded for the runtime SHA: Docker Publish, Gitleaks, Lint, Build Check, Trivy, SBOM, CodeQL, CI, Integration Smoke Gate, and E2E. No Mobile CI or OpenAPI Validate run is recorded for that SHA. Fresh local backend checks passed lint, typecheck, build, and 145 Jest suites / 1071 tests; docs links, 143 confirmed config keys, manifest JSON, and migration fresh-database checks also passed. The final provider smoke must still bind each deployment to the final immutable SHA tag after the documentation commit.

At runtime-candidate capture, Vercel automatically deployed Admin and Restaurant from `f2c02ed`; both canonical `/api/healthz` endpoints returned the full revision and both deployment inspections reported `Ready`. Railway API deployment `8b8c3450-a5a7-4138-b030-c4c2b072702b` and worker deployment `ff50c82f-5471-4be9-b4fc-899e559a3efc` used the same immutable backend SHA image. API `/api/healthz` returned `status: ok`, `/api/readyz` returned `status: ready`, and both included the exact full revision. Worker logs showed PostgreSQL job outbox polling and `FoodFlow Worker started`. Final provider status is rechecked after publishing the report-only head as an equivalent immutable tag.

Railway migrate deployment `5e52c611-60d4-4c4a-a109-83d44eec21f0` used the immutable `f2c02ed` migrator image after an external schema backup at `D:\Food_Delivery-backups\supabase-public-schema-pre-recovery-20260715.sql`. It deleted only the two empty legacy buckets through the Supabase Storage API, resolved the single failed cleanup record after deletion, and applied the spatial-index and verification migrations. Direct database checks show 41 effective migrations, zero unresolved failures, only `foodflow-public` (public) and `foodflow-private` (private), both expected GiST indexes, and zero users, orders, and GPS-history rows.

Three already-applied migration files have checksums that do not match production history: `20260709143000_add_realtime_outbox`, `20260709150000_add_job_outbox`, and `20260712143000_add_production_storage_bucket`. No matching source was found in Git history or the eight local stashes. Their verified schema/index/RLS end-state matches the repository, but provenance is incomplete; those applied migration records/files were not rewritten. The current working tree adds a fail-closed checksum guard before every future provider/schema mutation; it will intentionally block a later migrator until this provenance is approved and reconciled. Do not use `prisma migrate resolve` to conceal these three mismatches. Supabase advisors report only the known `postgis` and `vector` extension-in-public warnings. These non-relocatable/provider-managed extension warnings remain documented rather than being changed destructively.

The API environment explicitly selected `REALTIME_PROVIDER=supabase` and had the publishable, secret, service-role JWT, ES256 private key, and key ID configured. Supabase had RLS enabled on `realtime.messages`, `realtime_outbox`, and `driver_location_history`; the private Broadcast SELECT policy required the topic to appear in the token's `realtime_channels` claim, and `realtime_outbox` was absent from the legacy `supabase_realtime` publication. That controlled authenticated GPS smoke obtained a five-minute scoped token, submitted simulated HCMC GPS through Railway, received private `admin:drivers` Broadcast, persisted PostGIS history in 1437 ms, and cleaned all temporary rows. Tracking/realtime code changed afterward, so this is bounded historical evidence rather than certification of SHA `a703ece`.

Docker Publish run `29387565225` passed build, runtime smoke, and eight architecture-specific Trivy scans. Docker Hub and GHCR expose matching immutable manifests:

| Artifact | `sha-f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b` digest |
| --- | --- |
| `foodflow-backend` | `sha256:4c00f02f6d5ed64cfac4507eb18d50c39166159941a772ead725740448d6bebd` |
| `foodflow-migrate` | `sha256:8e97a9adca15fe418288f83f43056310ab36c8b72ed7636a53a15c2950dda12a` |
| `foodflow-admin` | `sha256:6f4757635d983ecf74a784749ca4aa4222066f68928a6c88e5deb0da9bf09744` |
| `foodflow-restaurant` | `sha256:272ce1e2b56ac85078ccea008effdffad4e84f82ec1816026a9ae53559923753` |

The exact-revision public post-deploy smoke passed API/Admin/Restaurant health and Admin/Restaurant login pages for `vi`, `en`, and `ja`. Authenticated role smoke was intentionally not fabricated because production contains zero approved application users/orders. The current decision remains **NO-GO for full certification** pending authenticated Admin/Restaurant/Customer/Driver journeys, controlled FCM, Android/iOS background-location evidence, and optional provider smoke. No semver, `latest`, or GitHub Release promotion was performed for this historical candidate.

> **Historical snapshot — 2026-07-12.** The test counts, 27-migration result, image digests, and media QA statements below are evidence recorded for that date. They are not a claim about the current `master` head, the current dirty workspace, or production readiness.

## Historical local and provider-status update — 2026-07-14

Runtime candidate `52f433641d5093f6d064cfba6c1cd99c8cb035e9` passed 144 Jest suites / 1065 tests, typecheck, lint, the Nest build, and every GitHub workflow triggered for the SHA. Docker Publish run `29336146675` passed multi-architecture runtime smoke and all eight High/Critical Trivy scans. The earlier clean-volume `foodflow-batch4-e2e` stack applied all 38 migrations and passed Playwright 204/204; that remains bounded local evidence.

Railway migrate deployment `a9002614-ed2a-438c-9a4e-7170954052fc` completed successfully and reported 38 migrations with none pending. API deployment `4e51ae50-1218-4c1b-a315-3c31ddf6de5c` and worker deployment `4f818c68-ce66-4aab-ae6e-f8ed708b4f91` are `SUCCESS` from immutable SHA images. `https://foodflow-api-production.up.railway.app/api/healthz` returns HTTP 200 with `status: ok`, and `/api/readyz` returns HTTP 200 with `ready: true`; database, Redis, and Supabase Storage are up. Worker logs show the 1000 ms PostgreSQL outbox poll, disabled RAG synchronization, and `FoodFlow Worker started`. Both services use explicit fail-closed `FOODFLOW_PROCESS_ROLE` values.

Supabase Storage readiness uses the project `service_role` JWT supplied by Supabase. The opaque `sb_secret...` credential is not used as the Storage Bearer token; no credential value is printed or committed. A controlled production smoke created temporary driver/admin identities, obtained a five-minute scoped ES256 realtime token, submitted simulated HCMC GPS through the authenticated Railway API, received the private `admin:drivers` Broadcast, and verified the PostGIS history row in 1437 ms. Temporary database rows and the Redis active-driver entry were removed; final checks reported zero production users and zero location-history rows. The diff from that GPS smoke candidate to `52f4336` changes only process startup/config validation and PowerShell probes, not tracking or realtime code.

At that snapshot, Vercel deployments `dpl_5Yf8yfg8HPvQ8zHxww8AET9Cx5i9` (Admin) and `dpl_2AsBkXimCVh7BE6BLrHfDc4E1Bxa` (Restaurant) were Ready for the runtime-candidate push; their canonical health and localized login routes returned 200. `RAG_ENABLED=false` was intentional because no DeepSeek credential was configured. Without Google Directions or an owned OSRM service, route requests returned `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` while API/worker stayed healthy. The release decision remained **NO-GO** because controlled-device FCM, authenticated browser role journeys, the background-location device matrix, and configured FCM/SMTP/Twilio/SePay/DeepSeek/owned-routing smoke were incomplete.

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

That external provider evidence confirmed 38 forward migrations, the `token,registration_id` primary key, scoped private Broadcast authorization, split public/private Storage buckets, and empty production business/RAG tables. Direct authorization smoke denied a cross-user channel; the authenticated Railway GPS smoke received the allowed private Broadcast and persisted PostGIS history. The Vercel deployments recorded in that snapshot were Ready and their health/login routes passed, while authenticated browser role journeys remained pending.

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
