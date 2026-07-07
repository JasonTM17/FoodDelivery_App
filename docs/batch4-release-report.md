# Batch 4 release report

Last updated: 2026-07-07.

Verified remote code head: `118459e` (`origin/master`) before this local hardening refresh. Remote branch audit showed only `refs/heads/master`; the local `codex/batch4-integration` branch remains checked out in the clean worktree and tracks `origin/master`. The latest local code head `9c32d01` adds persisted driver incentive campaigns, is a fast-forward candidate for `master`, and `git rev-list --left-right --count origin/master...HEAD` returned `0 23` before this docs evidence refresh; re-run the ahead/behind check after each docs evidence commit before deleting the local branch. The latest whole-app non-deploy release gate remains `89f0d0e`, with focused validation added for `9c32d01`.

## What landed

- Batch 4 backend, Admin web, Restaurant web, and mobile client changes are merged into `master`; the remote feature branch has been removed.
- Admin and Restaurant E2E navigation now fails fast when the suite hits a wrong local Next.js 404 shell, and the axe focus smoke ignores Next.js devtools portal focus noise while still requiring a visible in-app focusable control.
- Backend tracking/route/dispatch tests verify route snapshots, admin tracking, heatmap, dispatch retries, Redis route cache invalidation, and route fetch failure behavior.
- Mobile tracking/driver route tests verify realtime route confirmation, stale route clearing, invalid coordinate rejection, backend route telemetry parsing, and heatmap rows without invented fallback metrics.
- The local hardening refresh removes runtime hardcoded i18n fallback maps, rejects stale/future GPS samples before they mutate live driver state, prevents stale queued ETA jobs from overwriting the current route phase, marks Admin driver markers stale when refreshes fail, blocks demo seed execution in production, and labels planned route geometry distinctly from telemetry replay.
- A local release-gate wrapper now lives at `infra/scripts/local-release-gate.ps1` so frozen installs, backend/web/mobile checks, OpenAPI Spectral lint, Docker Compose config validation, optional Playwright Chromium/Firefox, secret scan, and Supabase/Vercel preflight guards can be run consistently before push/deploy.
- Mobile order status labels and shared empty/error/availability labels now resolve through generated vi/en/ja localization instead of hardcoded Vietnamese model/UI strings.
- Mobile nearby browse now sends the backend `/restaurants/nearby` contract (`lat`/`lng` plus canonical cuisine values), fails closed when GPS is unavailable instead of using fake coordinates, builds list/map cuisine filters from real `cuisineTypes`, and localizes browse/search/driver-history error and filter labels through generated vi/en/ja strings.
- Backend dispatch/tracking now routes customer/restaurant order-facing dispatch events through the `/events` orders gateway, keeps `/dispatch` driver-only, and persists real provider pickup/dropoff route distance, duration, and geometry into `delivery_tasks` without fabricated ETA fallbacks.
- Driver incentives now use persisted `driver_incentive_campaigns` records and delivered driver tasks to compute active/completed campaign progress instead of returning `501 DRIVER_INCENTIVES_NOT_MODELLED`.
- Docker image publishing now targets the repository's live production branch, `master`, while retaining `v*` release-tag publishing.

## Local verification

| Area | Result |
|---|---|
| Backend install | `pnpm install --frozen-lockfile` passed |
| Backend Prisma | `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foodflow?schema=public DIRECT_URL=postgresql://postgres:postgres@localhost:5432/foodflow?schema=public pnpm exec prisma validate --schema prisma/schema.prisma` passed |
| Backend quality | `pnpm typecheck`, `pnpm lint`, full `pnpm exec jest --runInBand` (110 suites / 803 tests), and `pnpm build` passed in the 2026-07-07 local release gate at `89f0d0e`. |
| Backend map/route | Targeted Jest route/tracking/admin-tracking/dispatch run passed 8 suites / 76 tests. Latest tracking/dispatch hardening through `c825ad5` passed 5 focused suites / 60 tests plus backend `pnpm typecheck` and `pnpm lint`. |
| Backend driver incentives | `9c32d01` passed Prisma generate/validate, focused Jest for incentives/env validation (3 suites / 10 tests), backend `pnpm typecheck`, `pnpm lint`, `pnpm build`, OpenAPI Spectral, and focused mobile incentives tests 7/7 |
| Web install | `pnpm install --frozen-lockfile` passed |
| Web quality | `pnpm typecheck`, `pnpm lint`, full Vitest (Admin 37 files / 155 tests; Restaurant 31 files / 100 tests), and full Admin + Restaurant builds passed in the 2026-07-07 local release gate at `89f0d0e`. Restaurant build validation used an explicit secure public build-time URL; production deployment still correctly requires the real `NEXT_PUBLIC_RESTAURANT_URL` to be configured in Vercel. |
| OpenAPI | Spectral lint passed with `--fail-severity error` |
| Docker | `docker compose up -d --build migrate backend admin restaurant` rebuilt Backend/Admin/Restaurant from current source at `89f0d0e`; backend, Admin, and Restaurant health endpoints returned OK |
| Playwright | After the current-source Docker rebuild, Chromium + Firefox passed 70/70 tests, including realtime, tenant isolation, visual contract, and axe serious/critical smoke |
| Mobile | `flutter pub get --enforce-lockfile`, `flutter analyze`, full `flutter test` passed 225/225 tests, and `flutter build apk --debug` produced `build/app/outputs/flutter-apk/app-debug.apk`. Latest 2026-07-07 hardening rerun after `94d4e18` passed `flutter analyze`, focused `flutter test test/shared/restaurant_provider_nearby_contract_test.dart test/i18n/i18n_test.dart` 19/19, and full `flutter test` again: 229/229 tests. |
| Mobile map/route | Targeted tracking/driver route/heatmap Flutter tests passed 22/22 tests |
| Compose | `docker compose -f docker-compose.yml config --quiet` passed; production override passed with placeholder `POSTGRES_PASSWORD` and `REDIS_PASSWORD` |
| CI workflow syntax | `.github/workflows/docker-publish.yml` parsed successfully after retargeting Docker Publish from `main` to `master` |
| Secrets/runtime data | High-confidence tracked/staged scans found no live provider tokens or private keys; no tracked dotenv files were found. Generic candidates were reviewed as test variable names, local-only forbidden production defaults, or static Redis Lua scripts. Latest runtime keyword scan over production source found no `Math.random`, faker, or mock business-data generator; remaining hits were UI placeholders/loading fallbacks, fail-closed config guards, or localization metadata. |

Note: the verified Playwright run used `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, and `API_URL=http://[::1]:3001/api` because a separate local Node process is listening on `127.0.0.1:3000` outside the clean worktree.

## Deploy readiness

No production deploy was performed.

Current blockers:

- GitHub Actions cannot be treated as current-head green until the user restores token/auth/billing access and reruns CI/security/E2E workflows.
- GitHub should already show only one remote branch, `master`. The local `codex/batch4-integration` branch must remain until all local commits are pushed to `master` and patch-equivalence is rechecked.
- Supabase CLI is available through `npx supabase` (`2.109.0`), and the new `infra/scripts/supabase-preflight.{sh,ps1}` guard fails safely before deployment when `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`, or `DIRECT_URL` is missing. Current environment still lacks Supabase auth and production DB URLs, so Supabase database/realtime project access and migration deployment are not verified.
- Vercel CLI auth is present and the `food-delivery-app` project now exists. It is linked to the repo and configured for Admin's monorepo root `web/apps/admin`, but the new `infra/scripts/vercel-web-preflight.ps1` guard fails safely because the Admin production env list is missing `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_ADMIN_URL`, and `NEXT_PUBLIC_GOOGLE_MAPS_KEY`. Production deployment remains blocked until required public env and rotated secrets are configured.
- Restaurant web needs a separate Vercel project/domain or explicit hosting decision plus `NEXT_PUBLIC_RESTAURANT_URL`; the existing `food-delivery-app` project is currently configured for Admin.
- Production secrets are not verified: Supabase database URLs, JWT secrets, Redis, storage, SePay, DeepSeek, Google Maps, Vercel env, and any key previously pasted in chat must be rotated and stored only in provider secret managers.

Deploy only after these blockers are resolved, remote current-head checks are green, and production health checks pass.
