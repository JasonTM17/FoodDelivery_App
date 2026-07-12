# workers — Backend Service

## Purpose

Standalone background worker process. With `QUEUE_PROVIDER=supabase-postgres`, it drains durable `job_outbox` batches immediately, polls every second by default, never overlaps drains, and waits for an in-flight batch on shutdown. With `QUEUE_PROVIDER=bullmq`, it remains the explicit local/self-hosted compatibility worker.

## API surface

- No HTTP endpoints — worker process only
- Resolves dispatch, tracking, order, payment, and notification processors from the application modules
- Drains durable Postgres jobs only when `QUEUE_PROVIDER=supabase-postgres`

## Env vars

Same as main backend (DATABASE_URL, REDIS_URL, JWT_SECRET, etc.) — workers share env.

| Name | Default | Description |
|---|---|---|
| `JOB_OUTBOX_POLL_INTERVAL_MS` | `1000` | Postgres queue poll interval; valid range 100–60000 ms |
| `JOB_OUTBOX_DRAIN_LIMIT` | `25` | Maximum claimed jobs per Postgres drain; valid range 1–100 |

## Run locally

```bash
cd backend
pnpm worker  # Runs dist/workers/main.js
```

## Test

```bash
npx jest workers
```

## Runbook

- **Stuck Postgres queue:** inspect `job_outbox` status/attempts/run time and confirm the Railway worker is running with `QUEUE_PROVIDER=supabase-postgres`.
- **Worker crash loop:** check logs for a generic startup failure and validate required sealed environment variables without printing them.
- **Recovery drain:** call `GET|POST /api/jobs/drain?limit=1..100` only from an authenticated server-to-server operation with `CRON_SECRET`; it is not a browser or mobile route.
