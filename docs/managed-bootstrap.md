# Managed migration bootstrap (Supabase-hosted, proactive mode)

`backend/src/migrations/managed-bootstrap.ts` — `pnpm db:migrate:managed` inside
`backend/` (compiled entrypoint: `node dist/migrations/managed-bootstrap.js`).

## Why it exists

On hosted Supabase, canonical migration
`20260712161000_authorize_private_broadcast_and_split_storage` fails with
PostgreSQL error `42501` at `ALTER TABLE realtime.messages ENABLE ROW LEVEL
SECURITY`: `realtime.messages` is provider-owned and already has RLS enabled.
Bucket metadata in `storage.buckets` must likewise not be mutated through SQL.
Letting `prisma migrate deploy` attempt these is wrong twice over: it fails on
locked-down projects, and on projects where the statements *are* permitted it
mutates provider objects directly, bypassing the accepted API contract.

The canonical `migration.sql` files and
`approved-migration-checksum-provenance.ts` are **not** modified.

## How it works (proactive canonical-prefix checkpoints)

`migrate deploy` never sees the four provider migrations. The command:

1. **Failed-state first.** Reads `_prisma_migrations`. Exactly one unfinished
   row is tolerated — it must be one of the four approved migrations AND its
   recorded checksum must be a pinned canonical SHA-256 variant. Zero rows →
   continue; more than one, an unknown name, or unverified bytes → abort before
   any mutation.
2. **Per provider migration, in canonical order** (skipped if already
   finished):
   - *Canonical-prefix checkpoint*: builds a tempdir (`os.tmpdir()/foodflow-mb-*`,
     always removed) containing a byte-identical `schema.prisma` plus
     byte-identical copies of every **non-provider** migration dir strictly
     before it, then runs `migrate deploy --schema <tempdir>/schema.prisma`.
     Prefix completeness is then asserted from history.
   - *Compatibility checkpoint*: verifies the file's canonical checksum against
     pinned raw/LF/CRLF variants, removes the provider-forbidden fragments
     (any missing fragment = drift = abort), and executes the remaining
     original statements as **one** statement — a collision-checked
     `DO $mb_do$ BEGIN EXECUTE $mb_exec$ … $mb_exec$; END $mb_do$` wrapper
     inside a single transaction (`$executeRawUnsafe` accepts one statement
     only; verified against real PostgreSQL: nested canonical dollar tags
     `$bucket$/$roles$/$policy$/$storage$` survive, late failure rolls the
     whole batch back, retry succeeds).
   - *Bucket operations* through the Storage API: existence is decided only
     from a successful `listBuckets` inventory (auth/provider failure is
     fatal); `getBucket` supplies config detail for existing buckets — real
     storage-js returns a 404 `StorageApiError` for absent buckets, which is
     treated as fatal, never as "not found". Post-mutation the inventory and
     config are re-read.
   - *Effective postconditions* (SQL): exact policy inventory — the scoped
     broadcast policy must be the only policy on `realtime.messages`
     (`cmd=SELECT`, `PERMISSIVE`, `authenticated`, broadcast/JWT-channel
     predicate); any extra policy OR-bypasses it and aborts. Outbox RLS +
     `aclexplode` client-grant check for `anon`/`authenticated` + publication
     removal. `storage.objects` read policy scoped to `foodflow-public`. KYC
     index must exist, be unique, and keep the `driver_profile_id`/`pending`
     key+predicate. Legacy bucket deletions go through `deleteBucket` only
     (Supabase refuses non-empty) after predecessor creators are finished.
   - *Resolve*: only after every postcondition, `prisma migrate resolve
     --applied <name> --schema prisma/schema.prisma` records the migration —
     Prisma computes the canonical checksum from the real migration dir.
3. **Tail**: a final prefix deploy applies all remaining non-provider
   migrations; completion requires every canonical dir finished.

## Receipt

A JSON line is emitted per migration immediately after verified completion
(`status:"pending"`) and again after a successful resolve
(`status:"completed"`), each with `migrationName`, `sourceRevision`
(sha256 of the running module), `canonicalChecksum`, `transportChecksum`
(sha256 of the exact single statement sent), `actions`, `resolvedAt`. A final
`{"status":"done","receipt":[…]}` line summarizes. Entries are emitted as they
complete, so a later failure cannot erase earlier verified work.

## Usage

```bash
cd backend
DATABASE_URL=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=<JWT service key> \
  pnpm db:migrate:managed
```

- `DATABASE_URL` — migrations + postcondition checks (`DIRECT_URL` used by the
  schema where configured).
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — Storage API (JWT service-role
  required; `sb_secret` is rejected by Supabase Storage).
- Run once after the Supabase backup and before API rollout. The standard
  `dist/migrations/production-migrate.js` remains the default where canonical
  SQL applies cleanly.

## Fail-closed conditions

Ambiguous/unknown unfinished history; recorded or on-disk checksum outside the
pinned canonical variants; missing/disabled `realtime.messages` RLS; any
policy-inventory deviation (extra policies, wrong cmd/role/predicate,
restrictive); residual outbox grants or publication membership; KYC index
missing/non-unique/wrong predicate; Storage API errors at any step; non-empty
legacy bucket; unfinished predecessors; incomplete canonical prefix or tail.

## Limitations

- Compat requires the `postgres` role to hold `CREATE POLICY` on
  `realtime.messages`/`storage.objects` and `ALTER PUBLICATION` on
  `supabase_realtime` (the grants Supabase's own flows rely on). Denial fails
  before any resolve — never after.
- The transport executes the canonical remainder inside one transaction;
  canonical migrations run un-wrapped under `migrate deploy`. Net effect is
  equal or stricter.
- Mocked tests never prove live state; a real-Postgres regression exists for
  the transport/CLI mechanics (`FOODFLOW_MIGRATION_TEST_DATABASE_URL`, see
  `src/migrations/managed-bootstrap.postgres.spec.ts`). Live Supabase
  verification remains a controller gate.
