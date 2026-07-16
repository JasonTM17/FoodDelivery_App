# FoodFlow Project Roadmap

## Current objective

Finish Batch 4 as one verified production line: complete code and mobile parity, pass every local/remote gate, deploy Supabase + Railway + Vercel, verify production behavior, and publish immutable Docker artifacts from the verified `master` head.

Status on 2026-07-16: **runtime SHA `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` is deployed across Railway API/worker/migrator and both Vercel apps. API health/readiness and both public web health routes return that exact revision; Database, Redis, and Supabase Storage are ready with all 42 source migrations active. Current-revision GPS/private Broadcast/PostGIS smoke passed in 1,271 ms. Physical-device and full current four-role certification remain open**.

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
- Customer/Driver read-only production API auth, private Realtime shape, and cross-role denial passed with temporary rows removed. Still run each explicit native launcher to prove session restore/logout and the real role UI. Live FCM requires a controlled registered device/token and real production credentials; local lifecycle tests do not prove provider delivery.
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

- Historical local evidence: the clean-volume Docker project `foodflow-batch4-e2e` applied its then-current migrations, seeded disposable data, indexed RAG documents, and passed Playwright 204/204. Those counts are bounded 2026-07-14 evidence, not a claim about the current runtime SHA `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` or production approval.
- Deployed SHA `977d55f` has all 42 source migrations active; its 46-row Prisma history retains four rolled-back audit rows. Database, Redis, and Supabase Storage are ready. Exact Realtime and Job provenance is bound to an immutable migrator image. The audit intentionally fails only for `20260712143000_add_production_storage_bucket`, whose original bytes remain unrecovered, and blocks every future migrator rollout without rewriting applied SQL or remote history.

- The remaining extension-advisor warnings are documented constraints: PostGIS is non-relocatable, and moving pgvector would break the current Prisma/raw-operator search path. They are not hidden by unsafe schema changes.
- Railway migrate `e100789f-03c1-445d-9e69-b8a243973a95`, API `a84c63d1-c95e-4a69-a7eb-408e1a7dc9f4`, and worker `2e4a41ea-6874-4b01-b549-d457c0a20997` are successful at runtime SHA `977d55f19ddc4fecafb8a758d2df034f4b6ff21d`. API health/readiness report the exact revision with Database, Redis, and Supabase Storage ready; worker polling runs and RAG is intentionally disabled without DeepSeek.
- Google Maps is optional. With neither Google Directions nor an owned OSRM service, routing returns `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` while the processes remain healthy. FCM/SMTP/Twilio/SePay/DeepSeek/owned routing remain unconfigured or unsmoked.
- Vercel Admin `dpl_bE5TgrKS9GqKGHSShGHk1pX41Xqs` and Restaurant `dpl_J6sXb2UHV68XKAYBF4KLvqoXAjwz` are exact deployments of SHA `977d55f19ddc4fecafb8a758d2df034f4b6ff21d`; both public web health routes return that revision. The four-role Chrome/API journey remains historical SHA `17584153` evidence. Current-revision GPS/private Broadcast/PostGIS smoke passed, but does not replace physical-device or full UI certification.
- Release baseline `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` is tagged `v0.1.3`. Docker Hub and public GHCR SHA, `v0.1.3`, and `latest` aliases are digest-equal for all four runtime images; Docker Publish run `29490699451` and Release run `29490929946` verified the manifests and three release assets.
- Any previously pasted DeepSeek/provider key must be rotated before live smoke.

These are release blockers, not permission to add fake values or bypass validation.

## Release sequence after completion

1. Preserve the verified API/worker/Redis baseline; deploy future releases from one immutable SHA and recheck health/readiness/worker polling.
2. Configure only integrations being certified through sealed stores; do not fabricate Google Maps or other provider values.
3. Run current-revision Customer/Driver/Admin/Restaurant authenticated journeys, token refresh, active-order GPS snapshot/delta/reconnect, configured map/routing, chatbot, export, payment, notification, and tenant smoke; include one controlled-device FCM delivery. Preserve the historical four-role zero-state evidence without relabeling it as current certification.
4. Preserve the exact Admin and Restaurant SHA `977d55f` health baseline; rerun public and authenticated smoke whenever either deployment or the API revision changes.
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
