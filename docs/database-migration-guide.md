# Database Migration Guide

FoodFlow uses Prisma migrations over PostgreSQL/PostGIS. Supabase is the
managed production database; never use a local database command as a proxy for
production migration readiness.

## Connection roles

Prisma needs two production URLs:

| Variable | Purpose | Supabase example shape |
| --- | --- | --- |
| DATABASE_URL | Long-running Railway API/worker through Supavisor session mode | postgresql://...pooler.supabase.com:5432/postgres |
| DIRECT_URL | Migration and Prisma introspection through the Connect-dialog direct/session URL | postgresql://...pooler.supabase.com:5432/postgres |

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

### Production checksum provenance

Run the read-only production audit before any provider or schema mutation:

~~~powershell
cd backend
corepack pnpm run db:audit:prod
~~~

The guard accepts the migration SQL shipped locally, LF/CRLF variants of those
exact bytes, and only explicitly reviewed historical checksums recovered from
an immutable image. An approved historical checksum still requires the matching
local migration directory and its reviewed local checksum; a missing or changed
local migration cannot pass.

Current evidence:

- Realtime checksum
  `3f9705062cd288d93484e62d3afa98e3e5d9190941a9a1d62af8169eafb325a7`
  and Job checksum
  `72d4edd8a9a2397e604b38438025670f4b35d8beb7008ff0ae33157df58a7bdf`
  were recovered byte-for-byte from immutable migrator image
  `docker.io/nguyenson1710/foodflow-migrate@sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756`
  at revision `1f761a65b4a7053858a512bf6eb09a3fd2adbef0`. Realtime differs
  from current source only by line endings; Job differs only by line endings
  and a non-executable worker-host comment.
- Storage checksum
  `4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6`
  for `20260712143000_add_production_storage_bucket`, applied at
  `2026-07-12T01:08Z`, was recovered exactly from dangling Git blob
  `c29c069ea180ed6c3107411759b8ceb2150dc8e7`. The only byte difference from
  the tracked file was the missing final newline; the restored staged blob now
  matches production exactly.

The audit passes `42/42` active migrations. A fresh Supabase backup was captured
before the no-op migrator rollout at
`D:\Food_Delivery-backups\supabase-prod-pre-final-migrate-20260716.sql`
(SHA-256 `869c568475986e48387e171e050162d0de4f6716a83dea8ef581f2ae49629446`).
Never use `prisma migrate resolve` to conceal checksum drift; future changes
must add a forward migration and rerun this audit before provider mutation.

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
