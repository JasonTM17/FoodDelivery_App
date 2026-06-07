# infra/loadtest

k6 load test scripts for FoodFlow — final readiness gate before soft launch.

## Files

| File | Purpose |
|------|---------|
| `k6-mixed.js` | Main scenario: 100 RPS × 5 min, 60/30/10 traffic mix |
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

| Scenario | Rate | Traffic | Flow |
|----------|------|---------|------|
| `customer_flow` | 60 RPS | 60% | browse restaurants → get menu → place order |
| `restaurant_flow` | 30 RPS | 30% | list pending orders → confirm first order |
| `driver_flow` | 10 RPS | 10% | location ping → check available offers |

## Thresholds (CI gates)

| Metric | Threshold |
|--------|-----------|
| `http_req_duration` p95 | < 500 ms |
| `http_req_failed` | < 1% |
| `errors` (custom rate) | < 1% |
| `order_place_duration_ms` p95 | < 800 ms |
| `location_ping_duration_ms` p95 | < 200 ms |

k6 exits non-zero if any threshold is breached — CI fails accordingly.

## Fixture overrides

Seeded restaurant/menu IDs are resolved automatically via the restaurant API at `setup()` time. Override manually if needed:

```bash
k6 run \
  --env FIXTURE_RESTAURANT_ID=abc-123 \
  --env FIXTURE_MENU_ITEM_ID=def-456 \
  infra/loadtest/k6-mixed.js
```

## CI

Runs in `.github/workflows/integration.yml` as the `k6-load` job.
Skip with `SKIP_K6=1` locally or the `skip_k6` workflow dispatch input.
