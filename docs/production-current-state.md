# Production Current State

Last verified: 2026-07-16 (UTC), after `master` commits `d2024a87397a0395e174fbc0237e83732fc07ae9` and `84eeac3`.

This page is the authoritative operational snapshot. Older release paragraphs in the README, roadmap, testing guide, and gallery describe bounded evidence captured before this rollout; they are not a second current deployment.

## Runtime

| Component | Deployment | Artifact / revision | Result |
| --- | --- | --- | --- |
| Railway API (`foodflow-api`) | `2ab0ab25-3859-4fdf-8b26-61a7dd7e68a0` | `docker.io/nguyenson1710/foodflow-backend@sha256:41958eafbc0bf8201f9a6fedeb1afc485bde3436a308e79b2353c85d97850f6a` | Running |
| Railway worker (`foodflow-worker`) | `96f87967-0009-45c2-b348-48ac6150c6d8` | Same backend digest | Running |
| Railway migrator | `e100789f-03c1-445d-9e69-b8a243973a95` | `foodflow-migrate:sha-977d55f19ddc4fecafb8a758d2df034f4b6ff21d` | Successful, stopped |
| Vercel Admin | Existing production deployment | Revision `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` | HTTP 200 |

The checkout response fix is backend-only, so no production migrator run was authorized. Commit `84eeac3` restores the production Storage migration's byte-compatible trailing newline and adds a regression for the recorded checksum
`4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6`.
The migration checksum guard suite passes `10/10`; the sole source-byte provenance blocker is resolved. Future schema changes still require a backup and a fresh read-only production audit before running the migrator.

## Health evidence

- `GET https://foodflow-api-production.up.railway.app/api/healthz` → HTTP 200, `status: ok`, revision `d2024a87397a0395e174fbc0237e83732fc07ae9`; database, Redis, and Supabase Storage are `up`.
- `GET https://foodflow-api-production.up.railway.app/api/readyz` → HTTP 200, `ready: true`, same revision and component status.
- Worker logs after rollout contain zero error-level lines; startup shows the Postgres outbox poller and `FoodFlow Worker started`.
- Local contract verification: backend order suite `32/32` and media integrity `2/2` pass.
- Remote gates for `d2024a8`: Docker Publish `29513693036`, Integration Smoke Gate `29513628856`, E2E Tests `29513630447`, CI `29513629807`, SBOM, CodeQL, Trivy, Gitleaks, Build Check, and Lint all pass.

## Vercel quota boundary

The two Vercel commit statuses are `failure` only because the free-plan build quota returned `Deployment rate limited — retry in 24 hours`. No web source changed in the checkout fix, so the verified Admin production surface remains healthy at the previous web revision. Retry a Vercel deployment after the quota window; do not change production secrets or bypass the provider limit.

## Rollback

If the checkout rollout needs to be reverted, reconnect both Railway services to the previous immutable backend image:

```text
docker.io/nguyenson1710/foodflow-backend@sha256:473664235ffd0ce5b6746cb7da237f595f75ccdc27825450fdcaade73909cf39
```

Then redeploy both services, confirm `/api/healthz` and `/api/readyz`, and inspect worker logs. Do not run the migrator during this rollback.

## Still outside certification

Physical Android/iOS background-location behavior, controlled FCM delivery, active-order routing on a physical device, optional provider credentials, and a fresh authenticated four-role browser journey on the current web revision remain explicitly uncertified.
