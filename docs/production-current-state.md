# Production Current State

Live production truth is tag-bound. Resolve the promoted source with
`git rev-list -n 1 v0.1.4`, then require Railway API health, Railway worker
image metadata, and the Vercel Admin/Restaurant health endpoints to resolve to
that same full SHA. Dated
deployment IDs below are evidence snapshots and must not be read as dynamic
provider state.

This page is the authoritative operational snapshot. Older release paragraphs
in the README, roadmap, testing guide, and gallery are bounded historical
evidence, not a second current deployment.

## Runtime

| Component | Deployment | Immutable artifact / revision | Result |
| --- | --- | --- | --- |
| Railway API (`foodflow-api`) | `5b545476-8e0b-4208-8532-9d696bd5e00f` | `docker.io/nguyenson1710/foodflow-backend@sha256:09bae57f907fc6d13c9874a673a8d73397510e3d50f75b6f20415e948285c24e` | Recovery snapshot: running after credential rotation |
| Railway worker (`foodflow-worker`) | `e3b8a1cf-6432-4e6b-ac09-6e142e338da4` | Same backend digest | Recovery snapshot: running after credential rotation |
| Railway migrator | `e61a23bc-ce7e-4ef7-9daa-12160e20f105` | `docker.io/nguyenson1710/foodflow-migrate@sha256:04a089f17269d8ceb94f3f55cb241c91e0eb16db68ffaae4067c8f9a7bbbe16d` | Successful, stopped; no pending migrations |
| Vercel Admin | Canonical production alias | Recovery snapshot source `e6def517334681f3e003685489bd190e72408344` | Ready, health/login HTTP 200 |
| Vercel Restaurant | Canonical production alias | Recovery snapshot source `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` | Ready, health/login HTTP 200; revision differed from Admin/Railway |

The runtime SHA tag is
`sha-84eeac3a2845868fc3a7fd45f8a73775e834a09d`. Docker Publish run
`29515529360` built and smoke-tested AMD64/ARM64 images; all High/Critical
Trivy checks passed. The remaining public image digests are:

- Admin:
  `sha256:1f75f3fd4cd6b9cc4b0814efee3aab79643f5f9ce6962cabd1505ef57c4992db`
- Restaurant:
  `sha256:d92f6b8baaccc0a7ae8f83a22bff4d5d949fa07f6242fa456616465b44059316`

All four Docker Hub and GHCR packages are public. The worker intentionally uses
the backend image with a worker command rather than a fifth duplicate package.
`latest` and semantic release tags remain on the last fully promoted release;
new candidates are always published first as immutable `sha-<full-commit>` tags.

## Supabase and migration evidence

Production has all `42/42` active source migrations. Migration
`20260712143000_add_production_storage_bucket` was restored exactly from Git
blob `c29c069ea180ed6c3107411759b8ceb2150dc8e7`; its production SHA-256 is
`4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6`.
The focused checksum guard passes `10/10`, and the read-only Railway audit
returns `checksumStatus: ok`.

The Supabase database password was rotated on 2026-07-17 after an unsafe local
diagnostic exposed the previous value. The replacement is stored only in
Supabase/Railway secret stores. Railway deployed both `DATABASE_URL` and
`DIRECT_URL` changes for API, worker, and migrator. Post-rotation evidence is:

- migrator: 42 migrations found, no pending migration;
- checksum audit: `checksumStatus: ok`, `activeAppliedMigrations: 42`;
- API/worker logs: no error, exception, fatal, or authentication-failure match;
- `/api/healthz` and `/api/readyz`: HTTP 200 with Database, Redis, and Supabase
  Storage up.

Storage contains exactly `foodflow-public` (public, image MIME allow-list, 5 MB)
and `foodflow-private` (private, image/PDF allow-list, 4 MB). Supabase Realtime
has one authenticated Broadcast SELECT policy that requires the requested topic
to appear in the JWT `realtime_channels` claim. Security Advisor has zero errors
and only the known `postgis`/`vector` extension-location warnings; Performance
Advisor has zero errors and zero warnings.

The pre-rollout Supabase backup is stored outside the repository at:

```text
D:\Food_Delivery-backups\supabase-prod-pre-final-migrate-20260716.sql
```

Backup SHA-256:
`869c568475986e48387e171e050162d0de4f6716a83dea8ef581f2ae49629446`.
Do not commit this backup. Future schema changes still require a new backup and
an exact-byte read-only audit before the migrator runs.

## Health evidence

- `GET https://foodflow-api-production.up.railway.app/api/healthz` returns HTTP
  200, `status: ok`, revision `84eeac3a2845868fc3a7fd45f8a73775e834a09d`;
  database, Redis, and Supabase Storage are `up`.
- `GET https://foodflow-api-production.up.railway.app/api/readyz` returns HTTP
  200, `ready: true`, with the same revision and component status.
- Worker startup logs show the PostgreSQL outbox poller at 1000 ms and
  `FoodFlow Worker started`.
- The public Admin and Restaurant health/login surfaces return HTTP 200.
- A controlled synthetic HCMC run proves ES256 realtime token issuance,
  private Supabase Broadcast authorization, accepted GPS fanout, PostGIS
  persistence, rejection paths, and cleanup.

## Vercel revision boundary

The earlier daily quota block cleared, but the 2026-07-17 recovery recheck found
split web revisions: Admin returned `e6def517…` and Restaurant returned
`977d55f…`. HTTP 200 alone is not release certification. Both canonical web
health endpoints, Railway API health, and the Railway worker image must equal
the promoted tag SHA.

Use the committed helper for both next deployments:

```powershell
.\infra\scripts\vercel-deploy-production.ps1 -App admin
.\infra\scripts\vercel-deploy-production.ps1 -App restaurant
```

It requires a clean `master` exactly matching `origin/master`, requires Railway
API health to report the same SHA first, injects the full Git SHA at build and
runtime, then rejects a canonical health response whose service, status, or
revision is wrong. Do not bypass this gate.

## Rollback

If the Railway rollout must be reverted, reconnect API and worker to the
previous immutable backend image:

```text
docker.io/nguyenson1710/foodflow-backend@sha256:473664235ffd0ce5b6746cb7da237f595f75ccdc27825450fdcaade73909cf39
```

Redeploy both services, confirm `/api/healthz` and `/api/readyz`, and inspect
worker logs. Do not run the migrator during this rollback.

## Still outside certification

Physical Android/iOS background-location behavior, controlled FCM delivery,
active-order routing on a physical device, optional provider credentials, and a
fresh authenticated four-role browser journey on the current web revision
remain explicitly uncertified.
