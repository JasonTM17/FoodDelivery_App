# FoodFlow Project Roadmap

## Current objective

Finish Batch 4 as one verified production line: complete code and mobile parity, pass every local/remote gate, deploy Supabase + Railway + Vercel, verify production behavior, and publish immutable Docker artifacts from the verified `master` head.

Status on 2026-07-14: **integration and current-head quality gates are green on `master`; managed deployment is incomplete; no-go for production**.

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
- Recapture product media only after the intended source is built and seeded; record source commit, Compose/image references, and whether the run used a clean final head or a dirty workspace.

### Mobile release validation

- Reconcile mobile work only from verifiable branches, commits, and patch evidence; do not name, recreate, or infer missing refs.
- Re-run generated API model/contract alignment, vi/en/ja, customer/driver flows, maps/GPS, offline/reconnect, scoped realtime denial, KYC, and signed release builds.
- Run separate Customer and Driver smoke from their explicit launchers: authenticate and restore/logout a session, prove allowed private realtime plus cross-role/cross-tenant denial, then exercise the role flow. Live FCM still requires a controlled registered device/token and real production credentials; local lifecycle tests do not prove provider delivery.
- Validate Android production signing and iOS build/signing on an authorized macOS runner; a local debug keystore is compile evidence only.

### Backend and production topology

- Audit remaining production Redis dependency and document/provision it explicitly or remove it safely; do not leave an accidental Vercel runtime dependency.
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

## Verified managed state and external blockers

- All ten required current-head GitHub workflows are green. The recorded matrix includes Backend 141 suites / 1043 tests, Mobile 352 tests, and isolated Docker E2E 204/204 in 5.8 minutes.
- Supabase is linked and all 35 forward migrations are applied. Private Broadcast authorization, split Storage buckets, removal of anonymous public-object listing, RLS, and empty production business/RAG tables were verified directly. One historical zero-step Prisma failure remains recorded as rolled back; applied SQL was not reversed or rewritten.
- The remaining extension-advisor warnings are documented constraints: PostGIS is non-relocatable, and moving pgvector would break the current Prisma/raw-operator search path. They are not hidden by unsafe schema changes.
- Railway topology and managed Redis pass, and the current-head migrator completed. The public API still returns 404 because API/worker have no deployment and lack 15 real provider configurations: Maps/OSRM, DeepSeek, SePay/webhook, SMTP, FCM, and Twilio. Live GPS/Broadcast and controlled-token FCM delivery therefore remain blocked.
- Admin and Restaurant are both GitHub-linked and READY on Vercel. Canonical health/login paths return 200 with no tunnel/localhost network requests or console errors; Restaurant tunnel env was replaced. Authenticated API/GPS smoke still depends on Railway.
- Current-head Docker SHA images remain unpublished. Existing private Admin/Restaurant GHCR packages are not connected to this repository, so the workflow gets 403 until repository access is granted. No semver or `latest` promotion is authorized.
- Any previously pasted DeepSeek/provider key must be rotated before live smoke.

These are release blockers, not permission to add fake values or bypass validation.

## Release sequence after completion

1. Rotate exposed credentials and enter the 15 real Railway provider configurations through secure stores.
2. Deploy API/worker from one immutable SHA; verify health/readiness/Cron. The current-head migrator is already complete.
3. Run production Customer/Driver auth, private-realtime allow/deny, token refresh, GPS snapshot/delta/reconnect, Storage, map, chatbot, export, payment, notification, and tenant smoke; include one controlled-device FCM delivery.
4. Re-smoke the exact Admin and Restaurant Vercel deployments against the healthy Railway API.
5. Connect the private Admin/Restaurant GHCR packages to this repository and grant Actions write access, then rerun the four-image SHA workflow.
6. Pull the SHA manifests in a clean environment, verify cross-registry digests/scans/runtime, then create immutable `v4.0.0` and manually promote `latest` only after production smoke.
7. Update final release report, registry digests, GitHub About/topics/homepage, and landing notes.

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
