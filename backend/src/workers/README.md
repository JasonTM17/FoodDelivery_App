# workers — Backend Service

## Purpose

Standalone BullMQ worker process for background jobs. Runs in separate container alongside main API. Consumes queues: order-timeout, dispatch, dispatch-retry, payment-refund, commission-split, payout-disbursement, notif-fcm, notif-smtp, notif-twilio, tracking-eta. Each processor idempotent; failures retry with exponential backoff.

## API surface

- No HTTP endpoints — worker process only
- Subscribes to all BullMQ queues defined in respective service modules

## Env vars

Same as main backend (DATABASE_URL, REDIS_URL, JWT_SECRET, etc.) — workers share env.

| Name | Default | Description |
|---|---|---|
| `WORKER_CONCURRENCY` | `5` | Parallel jobs per queue |
| `WORKER_MAX_RETRIES` | `5` | Default per-job retry cap before DLQ |

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

- **Stuck queue:** Inspect via `bull-board` UI at `:3001/admin/queues` (admin auth required).
- **DLQ overflow:** Failed jobs >5 retries land in `<queue-name>:failed`. Run `pnpm scripts:dlq-replay <queue-name>` to retry batch.
- **Worker crash loop:** Check container logs for fatal exception. Common cause: missing env var. Verify all secrets injected.
- **Memory leak:** Restart worker container; long-running BullMQ workers can accumulate listener leaks. Schedule weekly rolling restart.
