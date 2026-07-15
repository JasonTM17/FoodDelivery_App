# FoodFlow Project Roadmap

## Current objective

Finish Batch 4 as one verified production line: complete code and mobile parity, pass every local/remote gate, deploy Supabase + Railway + Vercel, verify production behavior, and publish immutable Docker artifacts from the verified `master` head.

Status on 2026-07-15: **runtime SHA `17584153ff256b74a3413ae9844f4f27bff038cc` is deployed across Railway API/worker/migrator and both Vercel apps; exact-revision health, public `vi/en/ja` login smoke, and the 41-migration Supabase state are green, while full production certification remains no-go**.

## Completed and incorporated work

- Controlled consolidation of available backend, Admin, Restaurant, mobile, AI, realtime, map/tracking, docs, and DevOps work.
- Remote and local branch cleanup is complete: only `master` remains, and no linked integration worktree remains. Do not recreate historical integration branches.
- Admin/Restaurant runtime API-envelope validation and removal of fake empty/zero business fallbacks across critical screens.
- Restaurant URL-authoritative vi/en/ja locale isolation and accessibility contrast/focus fixes.
- Backend Supabase Realtime outbox/RLS token contract, Supabase Storage adapter, and PostgreSQL job outbox/Cron endpoint.
- Admin and Restaurant Supabase Realtime client support with explicit provider selection.
- DeepSeek `deepseek-v4-flash` provider adapter, persisted session/usage telemetry, fail-closed provider errors, and Admin monitor contract.
- Shipper GPS freshness, route-phase geometry, provider ETA/progress, tracking authorization, and hardcoded map fallback removal.
- Node 22.13+/pnpm 11.11 alignment and frozen-install paths.
- Multi-architecture non-root Backend/Migrate/Admin/Restaurant images and fail-closed Docker release promotion.
- Screenshot/GIF capture tooling and rewritten architecture/deployment/testing documentation. Existing media is historical until recaptured with source/runtime references.
- Admin URL locale ownership, localized overview KPI labels, and accessible color tokens. The related vi/en/ja browser and axe record is historical and needs a fresh final-head rerun.
- Mobile managed realtime parity through scoped Supabase token/channel authorization, receive-only outbox subscriptions, authenticated REST GPS/dispatch decisions, and explicit Socket.IO local compatibility.
- Private driver KYC storage, owner-scoped upload grants, image metadata/signature checks, one-pending enforcement, signed Admin review, typed mobile onboarding, and vi/en/ja UI/tests.

## In progress before release

### UI, UX, i18n, and media

- Audit every Admin/Restaurant critical page in fresh `vi`, `en`, and `ja` contexts for title, `html lang`, visible text, aria text, number/date/currency formatting, and cookie isolation.
- Complete responsive/keyboard/axe review for dashboard, approval, promotion, audit/export, staff, benchmark, AI monitor, map, and order flows.
- Compare implementation with approved Stitch/design artifacts and establish accepted visual regression evidence.
- Current-source local visual evidence: after the Restaurant mobile Kanban fix, CLS was approximately 0.0037. This is a measured regression check, not a complete pixel baseline or production approval.
- Recapture product media only after the intended source is built and seeded; record source commit, Compose/image references, and whether the run used a clean final head or a dirty workspace.

### Mobile release validation

- Reconcile mobile work only from verifiable branches, commits, and patch evidence; do not name, recreate, or infer missing refs.
- Re-run generated API model/contract alignment, vi/en/ja, customer/driver flows, maps/GPS, offline/reconnect, scoped realtime denial, KYC, and signed release builds.
- Run separate Customer and Driver smoke from their explicit launchers: authenticate and restore/logout a session, prove allowed private realtime plus cross-role/cross-tenant denial, then exercise the role flow. Live FCM still requires a controlled registered device/token and real production credentials; local lifecycle tests do not prove provider delivery.
- Validate Android production signing and iOS build/signing on an authorized macOS runner; a local debug keystore is compile evidence only.

### Backend and production topology

- Keep the verified Railway managed Redis dependency healthy and monitor readiness; do not introduce a Vercel runtime dependency.
- Validate every migration in the final source head against a fresh PostGIS database and the target Supabase project; do not rely on an old fixed migration count.
- Verify RLS/publication/storage policies and cross-tenant realtime denial against Supabase, not only unit tests.
- Run live DeepSeek, Google routing, SePay, notification, export, storage, and secured Cron smoke with rotated secrets.
- Review mutable third-party Compose image tags and pin release-relevant dependencies.

### Testing and security

- Fresh backend Prisma/typecheck/lint/full Jest/build.
- Fresh web frozen install/typecheck/ESLint/full Vitest/build.
- Full Playwright Chromium + Firefox and critical-page axe serious/critical = 0.
- Accepted visual/Stitch regression and tenant isolation.
- Flutter frozen dependency fetch, analyze, full tests, and customer/driver release builds at the final source head.
- Full repo/staged secret scan, Gitleaks, CodeQL, dependency audit, Trivy, SBOM, actionlint, ShellCheck.

## Current-source evidence and external blockers

- Historical local evidence: the clean-volume Docker project `foodflow-batch4-e2e` applied its then-current migrations, seeded disposable data, indexed RAG documents, and passed Playwright 204/204. Those counts are bounded 2026-07-14 evidence, not a claim about runtime SHA `17584153ff256b74a3413ae9844f4f27bff038cc` or production approval.
- The live Prisma status check reports all 41 repository migrations applied with none pending. Database, Redis, and Supabase Storage are ready. Historical rolled-back or checksum-provenance records remain audit history; applied SQL was not reversed or rewritten.
- The remaining extension-advisor warnings are documented constraints: PostGIS is non-relocatable, and moving pgvector would break the current Prisma/raw-operator search path. They are not hidden by unsafe schema changes.
- Railway migrate `6438d9ff-caa3-433c-afc1-81c4885797a8`, API `340fd29c-8198-41f0-8dc4-a097ecbe3438`, and worker `6c2201d1-ccce-444f-b592-4ac4fb20c287` are successful at runtime SHA `17584153ff256b74a3413ae9844f4f27bff038cc`. API health/readiness report the exact revision with database, Redis, and Supabase Storage ready; worker polling runs and RAG is intentionally disabled without DeepSeek.
- Google Maps is optional. With neither Google Directions nor an owned OSRM service, routing returns `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` while the processes remain healthy. FCM/SMTP/Twilio/SePay/DeepSeek/owned routing remain unconfigured or unsmoked.
- Vercel Admin `dpl_3Gm3hB31QJrrRq7QPSSQD9x2Wkgp` and Restaurant `dpl_8YVNGQCyWCzkCezeXYD1gKAb89CZ` are exact redeploys of SHA `17584153ff256b74a3413ae9844f4f27bff038cc`. Canonical health returns that revision and public `vi/en/ja` login smoke passes; authenticated Admin/Restaurant/Customer/Driver journeys remain pending.
- Docker Hub SHA, `v0.1.1`, and `latest` aliases match for all four runtime images. Public GHCR SHA manifests are digest-equal; no broader GHCR semver promotion is claimed.
- Any previously pasted DeepSeek/provider key must be rotated before live smoke.

These are release blockers, not permission to add fake values or bypass validation.

## Release sequence after completion

1. Preserve the verified API/worker/Redis baseline; deploy future releases from one immutable SHA and recheck health/readiness/worker polling.
2. Configure only integrations being certified through sealed stores; do not fabricate Google Maps or other provider values.
3. Run production Customer/Driver/Admin/Restaurant authenticated journeys, token refresh, GPS snapshot/delta/reconnect, configured map/routing, chatbot, export, payment, notification, and tenant smoke; include one controlled-device FCM delivery.
4. Preserve the exact Admin and Restaurant SHA `17584153` health baseline; rerun public and authenticated smoke whenever either deployment or the API revision changes.
5. For a future release, promote only the already verified immutable artifact after all remaining smoke; never rebuild or retag an unverified digest.
6. Update final release report, registry digests, GitHub About/topics/homepage, and landing notes.

## Post-release

- Monitor API/web health, Cron backlog, realtime delivery, AI cost/error rate, map provider failures, storage, and payments.
- Validate mobile production signing and staged rollout after the web/API production line is healthy.
- Define retention/cleanup for realtime/job outboxes and AI telemetry.
- Close/remove superseded Docker Hub worker tags only after backup and consumer audit.
- Preserve the one-branch policy and do not recreate historical integration worktrees or refs.

## Deferred by design

- Kubernetes/microservice extraction until measured scale requires it.
- Unsupported Parquet export until a real writer/storage lifecycle exists.
- Broad public Supabase channels or RLS bypasses.
- Recreating unavailable historical branches.
- Deploying from local-only evidence while remote CI is unavailable.
