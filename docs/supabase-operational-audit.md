# Supabase Production Audit

Audit date: **2026-07-14**. Scope: read-only metadata, schema, policy, and
advisor checks against the linked production project. No secrets,
business rows, user records, or Storage object names were read or changed.

## Status

The project reports active and healthy. The Prisma migration history contains
all 38 tracked migrations, including the address single-default index and UUID
default. The checked business and RAG tables, plus all four Storage buckets,
have zero rows or objects.

This proves the hosted database state. It does not prove the separate Railway
API/worker deployment, production user journeys, payments, maps, or FCM.

## Access control

| Surface          | Verified state                                                                                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business tables  | 60 application tables have row-level security. No `anon` policy grants business-row access.                                                                                                                                                    |
| PostGIS metadata | `public.spatial_ref_sys` is the sole non-RLS table and is readable by normal roles; it contains coordinate-reference metadata, not FoodFlow data.                                                                                              |
| Service data     | `job_outbox`, payment receipts/refunds, KYC, and AI usage grant `ALL` only to `service_role`.                                                                                                                                                  |
| Realtime         | `realtime.messages` accepts Broadcast receive only when the authenticated signed token has the requested `realtime_channels` claim. `realtime_outbox` has the same channel-scoped read boundary and is not in `supabase_realtime` publication. |
| Storage          | `foodflow-public` and `foodflow-production` are public but empty. `foodflow-private` and `foodflow-kyc` are private and empty. No Storage object policy grants were found.                                                                     |

The dashboard-level data-interface schema setting was not exposed by the
read-only CLI. Effective database row-level security is verified; keep that interface's schema surface
disabled as required by the project migration comment and deployment guide.

## Advisor findings

Supabase security advisors return two warnings: `postgis` and `vector` are
installed in the `public` schema. Their objects are provider-owned; PostGIS is
non-relocatable once geometry columns depend on it, and moving vector would
change the current search path. Do not move either extension merely to silence
the warning. Any relocation needs a reviewed backup, compatibility plan,
forward migration, and rollback rehearsal.

Performance advisors report no warnings. Informational unused-index findings
are expected while the checked business tables are empty; do not drop indexes
without real workload evidence.

The empty legacy buckets `foodflow-kyc` and `foodflow-production` should be
reviewed before a release. Delete or privatize them only after confirming no
deployed client or operational process references them.

## Recheck commands

Run only through an approved linked Supabase CLI session. These commands do
not print credential values.

```powershell
supabase projects list
supabase db advisors --linked --type security --level warn
supabase db advisors --linked --type performance --level warn

supabase db query --linked "select count(*) from public._prisma_migrations where finished_at is not null"
supabase db query --linked "select indexname from pg_indexes where schemaname = 'public' and tablename = 'addresses' and indexname = 'addresses_one_default_per_user_key'"
```

See the [deployment guide](./deployment-guide.md#4-supabase-deployment) for
the migration and production-smoke order, and the [release report](./batch4-release-report.md)
for the wider release boundary.
