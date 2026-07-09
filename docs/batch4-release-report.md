# Batch 4 release report

Last updated: 2026-07-06.

Verified code head: `33e90ea` (`origin/master`) before this docs-only refresh. Remote branch audit showed only `refs/heads/master`; the local `codex/batch4-integration` branch remains checked out in the clean worktree and tracks `origin/master`.

## What landed

- Batch 4 backend, Admin web, Restaurant web, and mobile client changes are merged into `master`; the remote feature branch has been removed.
- Admin and Restaurant E2E navigation now fails fast when the suite hits a wrong local Next.js 404 shell, and the axe focus smoke ignores Next.js devtools portal focus noise while still requiring a visible in-app focusable control.
- Backend tracking/route/dispatch tests verify route snapshots, admin tracking, heatmap, dispatch retries, Redis route cache invalidation, and route fetch failure behavior.
- Mobile tracking/driver route tests verify realtime route confirmation, stale route clearing, invalid coordinate rejection, backend route telemetry parsing, and heatmap rows without invented fallback metrics.

## Local verification

| Area | Result |
|---|---|
| Backend install | `pnpm install --frozen-lockfile` passed |
| Backend Prisma | `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foodflow?schema=public DIRECT_URL=postgresql://postgres:postgres@localhost:5432/foodflow?schema=public pnpm exec prisma validate --schema prisma/schema.prisma` passed |
| Backend quality | `pnpm typecheck`, `pnpm lint`, full `pnpm exec jest --runInBand` (110 suites / 795 tests), and `pnpm build` passed |
| Backend map/route | Targeted Jest route/tracking/admin-tracking/dispatch run passed 8 suites / 76 tests |
| Web install | `pnpm install --frozen-lockfile` passed |
| Web quality | `pnpm typecheck`, `pnpm lint`, full Vitest (Admin 37 files / 153 tests; Restaurant 31 files / 100 tests), and `pnpm build` passed |
| OpenAPI | Spectral lint passed with `--fail-severity error` |
| Docker | Backend/Admin/Restaurant rebuilt from current source and all health checks were healthy |
| Playwright | Chromium + Firefox passed 70/70 tests, including realtime, tenant isolation, visual contract, and axe serious/critical smoke |
| Mobile | `flutter pub get --enforce-lockfile`, `flutter analyze`, full `flutter test` passed 224/224 tests, and `flutter build apk --debug` produced `build/app/outputs/flutter-apk/app-debug.apk` |
| Mobile map/route | Targeted tracking/driver route/heatmap Flutter tests passed 22/22 tests |
| Compose | `docker compose -f docker-compose.yml config --quiet` passed; production override passed with placeholder `POSTGRES_PASSWORD` and `REDIS_PASSWORD` |
| Secrets | High-confidence tracked/staged scans found no live provider tokens or private keys; no tracked dotenv files were found. Generic candidates were reviewed as test variable names, local-only forbidden production defaults, or static Redis Lua scripts |
| CI workflow syntax | `.github/workflows/docker-publish.yml` parsed successfully after retargeting Docker Publish from `main` to `master` |
| Secrets/runtime data | High-confidence tracked/staged scans found no live provider tokens or private keys; no tracked dotenv files were found. Generic candidates were reviewed as test variable names, local-only forbidden production defaults, or static Redis Lua scripts. Latest runtime keyword scan over production source found no `Math.random`, faker, or mock business-data generator; remaining hits were UI placeholders/loading fallbacks, fail-closed config guards, or localization metadata. |
| Supabase realtime/storage/queue foundation | After `fcdcfbd`, `f924a6f`, `eab4eaf`, `d5a0c5a`, and `f5ba366`, backend `pnpm exec prisma generate`, focused realtime/storage/queue/env Jest, backend `pnpm typecheck`, `pnpm lint`, `pnpm build`, and full `pnpm exec jest --runInBand` passed 116 suites / 849 tests. Admin/Restaurant focused realtime Vitest, typecheck, lint, and production-like builds passed with safe placeholder public values before commit. |
| Current web full gates | On 2026-07-09 after `7b84949`, Admin `pnpm --filter foodflow-admin typecheck`, `lint`, full `vitest run --maxWorkers=1` (42 files / 175 tests), and production-like `build` passed 70 localized pages. Restaurant `pnpm --filter restaurant typecheck`, `lint`, full `vitest run --maxWorkers=1` (33 files / 112 tests), and production-like `build` passed 55 localized pages. Build-time public values were safe placeholders except the public Supabase project URL; no production secret values were used. |
| Current mobile gates | On 2026-07-09 after `9cc19b9`, `flutter pub get --enforce-lockfile`, `flutter analyze`, full `flutter test` (252/252), and `flutter build apk --debug` passed, producing `mobile/build/app/outputs/flutter-apk/app-debug.apk`. Build emitted the existing non-fatal `share_plus` Kotlin Gradle Plugin compatibility warning for future Flutter releases. |
| Current non-deploy release-gate tail | On 2026-07-09 after `900e70d`, `infra/scripts/local-release-gate.ps1 -SkipBackend -SkipWeb -SkipMobile -SkipDeployPreflight` passed: clean worktree, high-confidence secret scan, OpenAPI Spectral lint with no error-severity findings, and Docker Compose config validation for default/prod/local compose files. Playwright E2E and deploy preflights were intentionally skipped in this tail run because local services/production secrets remain separately gated. |
| Current Playwright/Docker E2E | On 2026-07-09 after `aeae405`, Docker Desktop was started, `docker compose up -d postgres redis minio backend admin restaurant` brought the local stack healthy, and backend/Admin/Restaurant health endpoints returned 200. `ADMIN_URL=http://localhost:3000 RESTAURANT_URL=http://localhost:3002 API_URL=http://localhost:3001/api pnpm test:e2e --project=chromium --project=firefox` passed 70/70 tests, including AI chatbot contract, restaurant queue/order flows, realtime tracking, tenant isolation, axe serious smoke, and visual contract regression. |
| Controlled Dependabot salvage | On 2026-07-09, `0b44a54` salvaged `actions/checkout@7`; staged whitespace and high-confidence secret scans passed before commit. `43d577d` combined safe web dependency bumps (`autoprefixer`, Radix accordion/dropdown/slot/switch, `react-hook-form`) using `pnpm`, then passed `pnpm install --frozen-lockfile`, Admin and Restaurant typecheck, lint, full Vitest (Admin 42 files / 175 tests; Restaurant 33 files / 112 tests), and local-env production builds (Admin 70 localized pages; Restaurant 55 localized pages). |
| Vercel production preflight | `vercel project inspect` confirmed API/Admin/Restaurant roots and build settings after creating/configuring `foodflow-api` and `foodflow-restaurant`. Generated sensitive `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CRON_SECRET` were added directly to `foodflow-api` production env via Vercel sensitive env API without printing values. Known non-secret provider/public env defaults were added where safe. `infra/scripts/vercel-web-preflight.ps1` and `.sh` now check all three projects and aggregate missing env/settings before failing safely because real external secrets/keys are still missing. `infra/scripts/vercel-env-prompt.ps1` prints safe per-project env-add commands and can link per-project Vercel directories plus prompt locally for explicitly named values without writing `.env`, printing secrets, or deploying. |
| Supabase production preflight | `codex mcp add supabase --url https://mcp.supabase.com/mcp?project_ref=lvanszgszzfopusboich`, `codex mcp login supabase`, and `codex mcp list` succeeded; `npx supabase projects list --output json` and `infra/scripts/supabase-preflight.ps1` still fail safely because `SUPABASE_ACCESS_TOKEN` is not set for the Supabase CLI release shell. `infra/scripts/supabase-env-prompt.ps1` now prints the required release-shell env contract and can run `supabase-preflight.ps1` after prompting locally for session-only values without writing `.env`, printing secrets, or running migrations. |
| Secret scan tooling | `infra/scripts/secret-scan.ps1` now provides reusable high-confidence tracked-file and staged-added-line scanning without printing secret values. The local release gate calls this script in its Git hygiene step. On 2026-07-09, `secret-scan.ps1`, `secret-scan.ps1 -StagedOnly`, and a lightweight `local-release-gate.ps1 -AllowDirty -SkipBackend -SkipWeb -SkipMobile -SkipDeployPreflight -SkipOpenApi -SkipDockerConfig` run passed while this tooling patch was staged. |

Note: the verified Playwright run used `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, and `API_URL=http://[::1]:3001/api` because a separate local Node process is listening on `127.0.0.1:3000` outside the clean worktree.

## Deploy readiness

No production deploy was performed.

Current blockers:

- GitHub Actions cannot be treated as current-head green until the user restores token/auth/billing access and reruns CI/security/E2E workflows.
- Supabase CLI is not installed in the local PATH, so Supabase database/realtime auth and project access are not verified.
- Vercel CLI auth is present enough to list projects, but the account currently only shows `trash-sorter-v2`; this repository is not linked to FoodFlow Admin or FoodFlow Restaurant Vercel projects.
- Production secrets are not verified: Supabase database URLs, JWT secrets, Redis, storage, SePay, DeepSeek, Google Maps, Vercel env, and any key previously pasted in chat must be rotated and stored only in provider secret managers.

Deploy only after these blockers are resolved, remote current-head checks are green, and production health checks pass.
