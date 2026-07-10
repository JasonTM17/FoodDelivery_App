# Contributing to FoodFlow

FoodFlow is a NestJS API, two Next.js workspaces, and Flutter customer/driver
applications. Managed production is Supabase plus Vercel; Docker is the
repeatable local and self-hosted compatibility path.

This guide is deliberately conservative: make a small change, prove it locally,
then publish it only after the relevant release gates are green.

## Prerequisites

| Tool | Required |
| --- | --- |
| Git | Current supported release |
| Node.js | 22.x |
| Corepack + pnpm | pnpm 11.11.0 |
| Docker Desktop | Current supported release |
| Flutter | Version accepted by mobile/pubspec.yaml |

The backend and web workspaces have independent lockfiles. Use Corepack and
their checked-in pnpm version; do not use npm install or rewrite a lockfile as
a side effect of another task.

~~~bash
git clone https://github.com/JasonTM17/FoodDelivery_App.git foodflow
cd foodflow
corepack enable
~~~

Keep personal credentials in ignored files or provider secret managers. Never
copy .env, .env.production, a browser profile, supabase/.temp, or Vercel state
into Git.

## Isolated local development

Use a worktree for work that must not disturb another checkout:

~~~bash
git fetch --prune origin
git worktree add ../foodflow-feature -b codex/short-scope origin/master
cd ../foodflow-feature
~~~

The repository's release target is master. A temporary branch is useful while
developing, but do not recreate a stale remote branch or delete a worktree that
still owns changes.

### Full local compatibility stack

The base Compose stack uses PostgreSQL/PostGIS, Redis, MinIO, Socket.IO, and
BullMQ for local compatibility. It is not the managed-production architecture.

~~~bash
docker compose up --build -d
docker compose ps
curl http://localhost:3001/api/healthz
~~~

Default local ports are API 3001, Admin 3000, Restaurant 3002, PostgreSQL
5432, Redis 6379, and MinIO 9000/9001. Use only the example development
credentials in the local stack; production validation rejects them.

### Isolated release-test stack

Use the E2E overlay when another local FoodFlow stack may be running. It owns
different container names, ports, and volumes:

~~~bash
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up --build -d
curl http://localhost:13001/api/healthz
curl http://localhost:13000/api/healthz
curl http://localhost:13002/api/healthz
~~~

The isolated browser origins are <http://localhost:13000> and
<http://localhost:13002>. <http://127.0.0.1> intentionally exercises the CORS
failure path and is not a substitute origin.

## Install and run

### Backend

~~~bash
cd backend
corepack pnpm install --frozen-lockfile
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm start:dev
~~~

For a disposable local database only, deterministic seed data may be added with
corepack pnpm db:seed or corepack pnpm db:big-seed. The production bootstrap is
migration-only: never run either seed command against Supabase or any
production-like database.

### Admin and Restaurant

~~~bash
cd web
corepack pnpm install --frozen-lockfile
corepack pnpm dev
~~~

Navigate with an explicit locale, for example
<http://localhost:3000/vi/login> or <http://localhost:3002/en/login>. The
route locale is authoritative; a saved locale cookie is only a navigation
preference and must not override the URL.

### Mobile

~~~bash
cd mobile
flutter pub get
flutter analyze
flutter test
~~~

The mobile apps currently retain the local Socket.IO compatibility client.
Before a production mobile release, migrate them to the authenticated Supabase
realtime token/channel contract documented in
[API contract](api-contract.md#managed-production-realtime-and-job-drain).

## Required checks

Run the checks affected by the change before committing:

~~~bash
# backend
cd backend
corepack pnpm db:generate
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build

# web
cd ../web
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build

# mobile
cd ../mobile
flutter analyze
flutter test
~~~

Release candidates additionally require fresh migrations, Chromium and Firefox
Playwright coverage, axe serious/critical findings equal to zero, visual
regression, tenant-isolation, map/route, realtime authorization, AI
fail-closed/live smoke, Docker multi-architecture scans, OpenAPI lint, and
secret scans. The exact command matrix and evidence policy are in
[Testing guide](testing-guide.md).

## Change discipline

1. Read the affected controller/service/page and its tests before changing it.
2. Keep API payloads and OpenAPI in sync; use the shared web client rather than
   adding ad-hoc browser fetch wrappers.
3. Do not add runtime mock, random, or fake-zero business data to hide an
   unavailable API. Use an explicit loading, empty, or error state.
4. Treat tenant boundaries, RLS, role checks, map geometry, and financial
   amounts as security-sensitive.
5. Use translated visible and accessible text in Vietnamese, English, and
   Japanese. Test a fresh browser context for each URL locale.
6. Put database changes in an ordered Prisma migration. Do not edit an applied
   migration.

## Commits, reviews, and releases

Use Conventional Commits and keep each commit focused:

~~~text
feat(realtime): authorize tenant-scoped Supabase channels
fix(admin): translate overview KPI labels
docs(release): refresh deployment evidence
~~~

Before staging, inspect the diff and run the repository secret scan. Never
commit dotenv files, tokens, private keys, access/refresh tokens, fixture
passwords intended for production, or generated provider state.

When remote automation is available, pull requests and the full remote gate
must pass. A production release is only allowed after Supabase/Vercel preflight,
secure secrets, local gates, remote gates, and production smoke all pass. The
release then fast-forwards the validated integration head to origin/master; the
remote should retain only master.

See also:

- [Deployment guide](deployment-guide.md)
- [Database migration guide](database-migration-guide.md)
- [Security audit guide](security-audit-guide.md)
- [Docker and local development](docker-local-dev-guide.md)
