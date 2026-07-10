# FoodFlow Project Roadmap

## Current objective

Finish Batch 4 as one verified production line: complete code and mobile parity, pass every local/remote gate, deploy Supabase + Vercel, verify production behavior, fast-forward the isolated integration head to `master`, then publish immutable Docker artifacts.

Status on 2026-07-10: **hardening in progress; no-go for production**.

## Completed on the local integration line

- Controlled consolidation of available backend, Admin, Restaurant, mobile, AI, realtime, map/tracking, docs, and DevOps work.
- Remote branch cleanup to one branch (`master`); local integration retained until final fast-forward.
- Admin/Restaurant runtime API-envelope validation and removal of fake empty/zero business fallbacks across critical screens.
- Restaurant URL-authoritative vi/en/ja locale isolation and accessibility contrast/focus fixes.
- Backend Supabase Realtime outbox/RLS token contract, Supabase Storage adapter, and PostgreSQL job outbox/Cron endpoint.
- Admin and Restaurant Supabase Realtime client support with explicit provider selection.
- DeepSeek `deepseek-v4-flash` provider adapter, persisted session/usage telemetry, explicit degraded states, and Admin monitor contract.
- Shipper GPS freshness, route-phase geometry, provider ETA/progress, tracking authorization, and hardcoded map fallback removal.
- Node 22.13+/pnpm 11.11 alignment and frozen-install paths.
- Multi-architecture non-root Backend/Migrate/Admin/Restaurant images and fail-closed Docker release promotion.
- Current-source screenshots/GIF pipeline and rewritten architecture/deployment/testing documentation.

## In progress before release

### UI, UX, i18n, and media

- Fix visual-audit findings, including English Admin KPI labels rendered on Vietnamese overview.
- Audit every Admin/Restaurant critical page in fresh `vi`, `en`, and `ja` contexts for title, `html lang`, visible text, aria text, number/date/currency formatting, and cookie isolation.
- Complete responsive/keyboard/axe review for dashboard, approval, promotion, audit/export, staff, benchmark, AI monitor, map, and order flows.
- Compare implementation with approved Stitch/design artifacts and establish accepted visual regression evidence.
- Recapture final screenshots/GIFs only after UI acceptance.

### Mobile parity

- Replace production Socket.IO use with the same authenticated `POST /api/realtime/token` + Supabase channel contract as web.
- Keep Socket.IO only as explicit local/self-hosted compatibility if still required.
- Reconcile current mobile code with any actually available Violet/Indigo history; do not invent missing refs.
- Re-run generated API model/contract alignment, vi/en/ja, customer/driver flows, maps/GPS, offline/reconnect, and mobile builds.

### Backend and production topology

- Audit remaining production Redis dependency and document/provision it explicitly or remove it safely; do not leave an accidental Vercel runtime dependency.
- Validate all 22 migrations against a fresh PostGIS database and the target Supabase project.
- Verify RLS/publication/storage policies and cross-tenant realtime denial against Supabase, not only unit tests.
- Run live DeepSeek, Google routing, SePay, notification, export, storage, and secured Cron smoke with rotated secrets.
- Review mutable third-party Compose image tags and pin release-relevant dependencies.

### Testing and security

- Fresh backend Prisma/typecheck/lint/full Jest/build.
- Fresh web frozen install/typecheck/ESLint/full Vitest/build.
- Full Playwright Chromium + Firefox and critical-page axe serious/critical = 0.
- Accepted visual/Stitch regression and tenant isolation.
- Flutter frozen dependency fetch, analyze, full tests, and build after realtime migration.
- Full repo/staged secret scan, Gitleaks, CodeQL, dependency audit, Trivy, SBOM, actionlint, ShellCheck.

## External blockers

- GitHub Actions billing/auth/token access is exhausted; fresh current-head remote workflows cannot yet approve release.
- Supabase secure CLI shell lacks `SUPABASE_ACCESS_TOKEN` and production database URLs.
- Vercel API is missing required production integration/database/provider values.
- Admin and Restaurant are missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` in production.
- Any previously pasted DeepSeek/provider key must be rotated before live smoke.

These are release blockers, not permission to add fake values or bypass validation.

## Release sequence after completion

1. Freeze the final source head and run the full local gate.
2. Restore and pass every required GitHub workflow on that head.
3. Enter rotated secrets through secure prompts/dashboard and pass Supabase/Vercel preflight.
4. Deploy Supabase migrations, RLS, explicit Realtime publication, and Storage policies.
5. Deploy Vercel API; verify health/readiness/Cron.
6. Build/deploy Admin and Restaurant against the verified API alias.
7. Run production health plus authenticated realtime/map/chatbot/export/payment/notification/tenant smoke.
8. Fast-forward `HEAD` directly to `origin/master`; verify one remote branch and `0 0` equivalence.
9. Publish Docker SHA manifests, immutable `v4.0.0`, then manually promote `latest` after smoke.
10. Update final release report, registry digests, GitHub About/topics/homepage, and landing notes.

## Post-release

- Monitor API/web health, Cron backlog, realtime delivery, AI cost/error rate, map provider failures, storage, and payments.
- Validate mobile production builds/signing and staged rollout after realtime parity.
- Define retention/cleanup for realtime/job outboxes and AI telemetry.
- Close/remove superseded Docker Hub worker tags only after backup and consumer audit.
- Delete local integration branch/worktree only after `HEAD == origin/master` and all reports are archived.

## Deferred by design

- Kubernetes/microservice extraction until measured scale requires it.
- Unsupported Parquet export until a real writer/storage lifecycle exists.
- Broad public Supabase channels or RLS bypasses.
- Recreating unavailable historical branches.
- Deploying from local-only evidence while remote CI is unavailable.
