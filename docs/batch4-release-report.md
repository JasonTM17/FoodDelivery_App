# Batch 4 release report

Last updated: 2026-07-06.

Verified head: `64e46c795c9c15ae52bb0112f91e93a6f3851645` (`origin/master`). Remote branch audit showed only `refs/heads/master`; the local `codex/batch4-integration` branch remains checked out in the clean worktree and tracks `origin/master`.

## What landed

- Backend tracking snapshot access now allows authorized customers, assigned drivers, active restaurant staff, and admins while preserving tenant isolation.
- Restaurant order detail now renders a live Google Maps tracking panel backed by the real `/orders/{id}/tracking` snapshot and `/tracking` Socket.IO namespace.
- Restaurant web production config fails closed when the required browser Google Maps key is missing or placeholder-like.
- API/OpenAPI/docs describe the broadened tenant-safe tracking contract.

## Local verification

| Area | Result |
|---|---|
| Backend install | `pnpm install --frozen-lockfile` passed |
| Backend Prisma | `DATABASE_URL=postgresql://test:test@localhost:5432/test DIRECT_URL=postgresql://test:test@localhost:5432/test pnpm prisma validate` passed |
| Backend quality | `pnpm typecheck`, `pnpm lint`, full `pnpm test` (108 suites / 773 tests), and `pnpm build` passed |
| Web install | `pnpm install --frozen-lockfile` passed |
| Web quality | `pnpm typecheck`, `pnpm lint`, full Vitest (Admin 36 files / 150 tests; Restaurant 31 files / 100 tests), and `pnpm build` passed |
| OpenAPI | Spectral lint passed with `--fail-severity error` |
| Docker | Backend/Admin/Restaurant rebuilt from current source and all health checks were healthy |
| Playwright | Chromium + Firefox passed 70/70 tests, including realtime, tenant isolation, visual contract, and axe serious/critical smoke |
| Mobile | `flutter pub get --enforce-lockfile`, `flutter analyze`, `flutter test` (168 tests), and `flutter build apk --debug` passed |
| Compose | `docker compose -f docker-compose.yml config --quiet` passed; production override passed with placeholder `POSTGRES_PASSWORD` and `REDIS_PASSWORD` |
| Secrets | Fallback high-confidence tracked/staged scans found no live provider tokens or private keys; `gitleaks` is not installed locally |

Note: the verified Playwright run used `ADMIN_URL=http://[::1]:3000`, `RESTAURANT_URL=http://[::1]:3002`, and `API_URL=http://[::1]:3001/api` because a separate local Node process is listening on `127.0.0.1:3000` outside the clean worktree.

## Deploy readiness

No production deploy was performed.

Current blockers:

- GitHub Actions cannot be treated as current-head green until the user restores token/auth/billing access and reruns CI/security/E2E workflows.
- Supabase CLI is not installed in the local PATH, so Supabase database/realtime auth and project access are not verified.
- Vercel CLI auth works (`vercel whoami` returned the logged-in account), but this repository is not linked to a Vercel project and `vercel project ls` did not show FoodFlow Admin or FoodFlow Restaurant projects.
- Production secrets are not verified: Supabase database URLs, JWT secrets, Redis, storage, SePay, DeepSeek, Google Maps, Vercel env, and any key previously pasted in chat must be rotated and stored only in provider secret managers.

Deploy only after these blockers are resolved, remote current-head checks are green, and production health checks pass.
