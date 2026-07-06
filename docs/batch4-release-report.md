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

Note: the verified Playwright run used `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, and `API_URL=http://[::1]:3001/api` because a separate local Node process is listening on `127.0.0.1:3000` outside the clean worktree.

## Deploy readiness

No production deploy was performed.

Current blockers:

- GitHub Actions cannot be treated as current-head green until the user restores token/auth/billing access and reruns CI/security/E2E workflows.
- Supabase CLI is not installed in the local PATH, so Supabase database/realtime auth and project access are not verified.
- Vercel CLI auth is present enough to list projects, but the account currently only shows `trash-sorter-v2`; this repository is not linked to FoodFlow Admin or FoodFlow Restaurant Vercel projects.
- Production secrets are not verified: Supabase database URLs, JWT secrets, Redis, storage, SePay, DeepSeek, Google Maps, Vercel env, and any key previously pasted in chat must be rotated and stored only in provider secret managers.

Deploy only after these blockers are resolved, remote current-head checks are green, and production health checks pass.
