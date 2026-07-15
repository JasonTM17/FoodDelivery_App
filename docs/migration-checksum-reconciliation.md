# Migration checksum reconciliation

**Status:** source-side reconciliation prepared on 2026-07-15; production rollout is still gated.

This runbook records how FoodFlow recovered the three historical Prisma migration checksums that were already present in Supabase production. It is deliberately separate from a migration that changes application data: no `_prisma_migrations` row was rewritten, no migration was marked applied or rolled back, and no business data was created.

## Why this exists

Prisma stores a SHA-256 checksum for each migration when it is applied. A later migrator must not silently accept a different file, because a changed migration can hide a schema or security regression. The repository had three applied records whose raw production checksums differed from the current checkout. The differences were recovered from immutable build artifacts and Git object storage, then encoded as narrow, exact provenance exceptions.

The correct operational response is to recover and review the source, not to use `prisma migrate resolve` to hide an unknown drift. Prisma documents `migrate resolve` for failed migrations and baselining; it is not a checksum repair mechanism for a successful migration ([Prisma migrate resolve](https://docs.prisma.io/docs/cli/migrate/resolve), [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma)).

## Verified production records

The following values were read-only queries against the production `foodflow-api` environment. A record is effective only when `finished_at` is present and `rolled_back_at` is null.

| Migration | Production checksum | Current source checksum | Recovered evidence | Guard decision |
| --- | --- | --- | --- | --- |
| `20260709143000_add_realtime_outbox` | `3f9705062cd288d93484e62d3afa98e3e5d9190941a9a1d62af8169eafb325a7` | `40baeeddc6f209a7bbd257ba3acf07dad1be43cd34c7212f0457e945c48751c5` | SQL recovered from immutable `foodflow-migrate:sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0`; semantic content matches and only dirty line-ending representation differs. | Allow only this exact production/source pair. |
| `20260709150000_add_job_outbox` | `72d4edd8a9a2397e604b38438025670f4b35d8beb7008ff0ae33157df58a7bdf` | `1b85653815a9c7a228bf49eedeaff15efffeda76177988727b4f098a259d4606` | SQL recovered from the same immutable migrator artifact; the recovered comment was restored and only dirty line-ending representation differs. | Allow only this exact production/source pair. |
| `20260712143000_add_production_storage_bucket` | `4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6` | `a0812428130e34a0204d48b6227a98468105642e6b50dc8713f4a47d709c0d4f` | Exact blob recovered from Git object `c29c069ea180ed6c3107411759b8ceb2150dc8e7`; only a recovered trailing blank line differs, so the canonical source stays clean and the exact pair is allow-listed. | Allow only this exact production/source pair. |

The production rows remain unchanged. The recovered SQL was compared before editing the repository. The storage migration keeps the canonical source without a blank line at EOF; the recovered trailing blank line is represented by the exact exception pair rather than a lint-hostile source edit.

## Guard contract

`backend/src/migrations/migration-checksum-guard.ts` runs before the migrator touches Supabase Storage or executes schema mutations:

1. Read `_prisma_migrations` and keep only finished, non-rolled-back records.
2. Hash every local migration file using canonical LF bytes.
3. Accept an exact source checksum.
4. For a historical exception, accept only when the migration name, production checksum, and current source checksum all match the static entry in `migration-checksum-exceptions.ts`.
5. Throw `Applied migration checksum mismatch` for every other mismatch.

The guard skips only when the database has no `_prisma_migrations` table, which is required for a first-time local database. A missing local migration, a changed migration, an unknown exception, or a production checksum copied into the wrong file fails closed. The exception list contains hashes and evidence references only; it contains no credentials and does not weaken authorization or RLS.

## Evidence and reproducibility

The recovery used three independent checks:

- **Immutable image:** the published `sha-1f761...` migrator image was pulled without starting its migrator. Its distroless Node runtime was used to hash and print only the three migration files. A later `sha-919292...` image confirmed the storage file now matches the restored source.
- **Git object recovery:** `git fsck` located the storage SQL blob `c29c069...`; its SHA-256 is the production value. Its only difference from the clean source is one trailing blank line.
- **Production read-only query:** the three `_prisma_migrations` rows were queried through the Railway API service with Prisma. No mutation command was run during recovery.

Do not rely on an image tag without checking its digest. Do not download or print `DATABASE_URL`, JWTs, Supabase service keys, or Railway variables while repeating the procedure.

## Verification gates

Run from `backend/` after `corepack pnpm prisma generate`:

```powershell
corepack pnpm exec jest src/migrations/production-migrate.spec.ts --runInBand
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

The focused suite covers the exact approved pair, rejects an unexpected production checksum, and proves `main()` rejects before the provider is touched. A release still requires the full backend/web/mobile gates, CI, provider preflight, and authenticated role/device evidence.

## Production rollout rule

The current Railway `foodflow-migrate`, API, and worker deployments are from an earlier image and therefore do not prove that this guard is live. Do not claim production protection until one immutable image containing this guard is built, scanned, deployed to the one-off migrator, and its preflight logs are verified. Run the migrator once against a fresh backup, then deploy API and worker from the same immutable SHA only after the migrator exits successfully.

Keep the decision **NO-GO for full certification** until authenticated Admin, Restaurant, Customer, and Driver journeys, private Storage/KYC, token refresh and deny paths, controlled FCM delivery, and Android/iOS background-location evidence are captured. Local Chrome GIFs and Flutter captures document the four surfaces but are not production proof.

## Files

- `backend/src/migrations/migration-checksum-guard.ts`
- `backend/src/migrations/migration-checksum-exceptions.ts`
- `backend/src/migrations/production-migrate.ts`
- `backend/src/migrations/production-migrate.spec.ts`
- `backend/prisma/migrations/20260709143000_add_realtime_outbox/migration.sql`
- `backend/prisma/migrations/20260709150000_add_job_outbox/migration.sql`
- `backend/prisma/migrations/20260712143000_add_production_storage_bucket/migration.sql`
