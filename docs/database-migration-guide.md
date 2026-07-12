# Database Migration Guide

FoodFlow uses Prisma migrations over PostgreSQL/PostGIS. Supabase is the
managed production database; never use a local database command as a proxy for
production migration readiness.

## Connection roles

Prisma needs two production URLs:

| Variable | Purpose | Supabase example shape |
| --- | --- | --- |
| DATABASE_URL | Application/runtime connection through the pooler | postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true |
| DIRECT_URL | Direct migration and Prisma introspection connection | postgresql://...pooler.supabase.com:5432/postgres |

Keep both values only in a secure CLI environment or Vercel/Supabase secret
manager. Do not put real URLs in a committed .env file, a test snapshot, or a
shell transcript.

## Local development

Create a new migration only from a disposable local database:

~~~bash
cd backend
corepack pnpm db:generate
corepack pnpm db:migrate --name describe_change
corepack pnpm typecheck
~~~

Review the generated SQL before committing. PostGIS types may require explicit
SQL in the migration. Never amend an already-applied migration; add a new
forward migration instead.

## Production procedure

Production deployment is a gated, one-way operation:

1. Take or verify a provider backup and record the current migration state.
2. Place SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, DATABASE_URL, and
   DIRECT_URL in a secure process environment. Do not print them.
3. Run infra/scripts/supabase-preflight.ps1.
4. From backend/, run corepack pnpm db:generate, then
   corepack pnpm db:migrate:prod.
5. Verify Prisma migration status, API health, tenant boundaries, and the
   affected product flow.
6. Record the release evidence before web/API production deployment continues.

Use prisma migrate deploy (the db:migrate:prod script) in production. Do not
run any of the following against Supabase production:

~~~text
prisma migrate dev
prisma migrate reset
prisma db push
pnpm db:seed
pnpm db:big-seed
~~~

## Supabase policy verification

Batch 4's managed realtime/job/AI schema needs more than a successful Prisma
command:

- realtime_outbox, job_outbox, and ai_usage_events have row-level security
  enabled.
- Only realtime_outbox is added to the supabase_realtime publication.
- Authenticated browser clients may read realtime rows only when their
  short-lived JWT claim explicitly permits the channel.
- service_role access stays server-only; it is never sent to a browser or
  mobile binary.
- Cross-tenant order, restaurant, driver, audit, and export reads are denied
  by API authorization and tested against the deployed schema.

Run an authenticated POST /api/realtime/token smoke test and verify the denied
cross-tenant case after applying the migration. See
[API contract](api-contract.md#managed-production-realtime-and-job-drain).

### Dispatch offers

Migration `20260710200000_add_dispatch_offers` adds the server-only
`dispatch_offers` state machine. It enables RLS without granting a direct
browser/mobile policy, stores only SHA-256 offer-token hashes, and creates a
partial unique index that permits at most one pending/accepted offer per order.
After migration, verify reject, expiry, duplicate accept, concurrent driver
claim, and successful PostGIS delivery-task assignment before enabling mobile
production dispatch.

## Recovery

Prisma does not generate universal down migrations. A release must therefore
be backwards-compatible for the API version that is still serving traffic. If a
migration problem is found:

1. Stop the next deployment stage and preserve the failure evidence.
2. Prefer a reviewed forward repair migration when data has already changed.
3. Restore from the verified provider backup only under the incident runbook
   and with explicit authorization.
4. Re-run migration status, RLS/publication checks, and tenant smoke before
   reopening traffic.

Do not delete migration records, disable RLS broadly, or use a production reset
to make a status check pass.
