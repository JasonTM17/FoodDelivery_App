# infra/loadtest

k6 load test scripts for FoodFlow — final readiness gate before soft launch.

## Files

| File | Purpose |
|------|---------|
| `k6-mixed.js` | Main scenario: about 100 HTTP RPS for 5 minutes across customer, restaurant, and driver flows |
| `k6-helpers.js` | Auth helpers and test fixtures (shared across scenarios) |

## Quick start

Prerequisites: [k6 installed](https://k6.io/docs/getting-started/installation) and stack running.

```bash
# Start stack + seed
docker compose up -d
cd backend && pnpm db:big-seed

# Run load test (defaults to http://localhost:3001/api)
k6 run infra/loadtest/k6-mixed.js

# Override API URL
k6 run --env API_URL=http://staging.foodflow.vn/api infra/loadtest/k6-mixed.js

# Export JSON results
k6 run --out json=k6-results.json infra/loadtest/k6-mixed.js
```

## Scenarios

| Scenario | Default arrival rate | Flow |
|----------|----------------------|------|
| `customer_flow` | 20 iterations/s | browse restaurants → get menu → place order |
| `restaurant_flow` | 8 iterations/s | list pending orders |
| `driver_flow` | 4 iterations/s | timestamped location ping → check active order |

Each iteration performs multiple HTTP requests, so the default mix produces about 100 HTTP RPS rather than 32 RPS. Override the arrival rates with `LOADTEST_CUSTOMER_RATE`, `LOADTEST_RESTAURANT_RATE`, and `LOADTEST_DRIVER_RATE`.

## Thresholds (CI gates)

| Metric | Threshold |
|--------|-----------|
| `http_req_duration` p95 | < 500 ms |
| `http_req_failed` | < 1% |
| `errors` (custom rate) | < 1% |
k6 exits non-zero if any threshold is breached — CI fails accordingly.

## Fixture overrides

Seeded restaurant/menu IDs are resolved automatically via the restaurant API at `setup()` time. The customer pool defaults to 100 seeded accounts. The driver flow distributes VUs across the first 10 seeded drivers, which are guaranteed verified by `db:big-seed`, and sends a fresh `sampledAt` value along a stable movement path. Use `LOADTEST_DRIVER_POOL_SIZE=1..10` to reduce that pool.

Override restaurant/menu fixtures manually if needed:

```bash
k6 run \
  --env FIXTURE_RESTAURANT_ID=abc-123 \
  --env FIXTURE_MENU_ITEM_ID=def-456 \
  infra/loadtest/k6-mixed.js
```

## CI

Runs in `.github/workflows/integration.yml` as the `k6-load` job.
Skip with `SKIP_K6=1` locally or the `skip_k6` workflow dispatch input.
