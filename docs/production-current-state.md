# Production Current State

Last verified: 2026-07-16 (UTC), runtime revision
`84eeac3a2845868fc3a7fd45f8a73775e834a09d`.

This page is the authoritative operational snapshot. Older release paragraphs
in the README, roadmap, testing guide, and gallery are bounded historical
evidence, not a second current deployment.

## Runtime

| Component | Deployment | Immutable artifact / revision | Result |
| --- | --- | --- | --- |
| Railway API (`foodflow-api`) | `a0b5c5d4-1695-4584-9a73-12bcf66b1080` | `docker.io/nguyenson1710/foodflow-backend@sha256:09bae57f907fc6d13c9874a673a8d73397510e3d50f75b6f20415e948285c24e` | Running |
| Railway worker (`foodflow-worker`) | `0e1b7b4a-db42-4a2a-b61f-bbddeb244588` | Same backend digest | Running |
| Railway migrator | `67331bd5-0a58-4224-bb18-b97b48702eee` | `docker.io/nguyenson1710/foodflow-migrate@sha256:04a089f17269d8ceb94f3f55cb241c91e0eb16db68ffaae4067c8f9a7bbbe16d` | Successful, stopped |
| Vercel Admin | `dpl_4D8BMjZtB66Q8145tUxaGHsZcQNm` | Built from current tracked source; health metadata still reports `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` | Ready, public HTTP 200 |
| Vercel Restaurant | Last healthy production deployment | Previous verified web revision | Public HTTP 200; replacement blocked by free-team daily deployment quota |

The runtime SHA tag is
`sha-84eeac3a2845868fc3a7fd45f8a73775e834a09d`. Docker Publish run
`29515529360` built and smoke-tested AMD64/ARM64 images; all High/Critical
Trivy checks passed. The remaining public image digests are:

- Admin:
  `sha256:1f75f3fd4cd6b9cc4b0814efee3aab79643f5f9ce6962cabd1505ef57c4992db`
- Restaurant:
  `sha256:d92f6b8baaccc0a7ae8f83a22bff4d5d949fa07f6242fa456616465b44059316`

`latest` and semantic release tags were intentionally not moved: the current
Vercel web rollout is not yet revision-verifiable.

## Supabase and migration evidence

Production has all `42/42` active source migrations. Migration
`20260712143000_add_production_storage_bucket` was restored exactly from Git
blob `c29c069ea180ed6c3107411759b8ceb2150dc8e7`; its production SHA-256 is
`4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6`.
The focused checksum guard passes `10/10`, and the read-only Railway audit
returns `checksumStatus: ok`.

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

## Vercel quota and revision boundary

The Admin CLI deployment reached `Ready`, but the upload omitted an explicit
`BUILD_SHA`; therefore its health endpoint cannot prove the new source revision.
The Restaurant replacement was rejected with
`api-deployments-free-per-day` (retry after the provider quota resets).

Use the committed helper for both next deployments:

```powershell
.\infra\scripts\vercel-deploy-production.ps1 -App admin
.\infra\scripts\vercel-deploy-production.ps1 -App restaurant
```

It requires a clean `master` exactly matching `origin/master`, injects the full
Git SHA at build and runtime, then rejects a canonical health response whose
service, status, or revision is wrong. Do not bypass this gate or alter
production secrets to work around the provider quota.

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
