# metrics — Backend Service

## Purpose

Prometheus metrics endpoint exposing app + business KPIs. Wired via `nestjs-prometheus`. Scraped by Prometheus container (compose `--profile observability`). Standard counters per global rule #12: `http_requests_total{route,method,status}`, `http_request_duration_seconds{route,method}`, plus business-specific gauges (active drivers, queue depth, dispatch latency).

## API surface

- `GET /metrics` — Prometheus text exposition format
- Internal counters/histograms registered per service via `@PromCounter`, `@PromHistogram`

## Env vars

| Name | Default | Description |
|---|---|---|
| `METRICS_AUTH_TOKEN` | — | Bearer token gate (if set, scraper must send) |

## Test

```bash
npx jest metrics
```

## Runbook

- **Metric cardinality blowup:** Check Grafana for series count >10k per metric. Common cause: unbounded label (user_id). Audit `MetricsService.recordHttpRequest` to ensure labels are bounded enums only.
- **Scrape timeout:** If `/metrics` >5s response, registry too large. Reset via container restart; investigate metric leak.
- **Missing data in dashboard:** Check Prometheus targets at `:9090/targets`. Ensure `foodflow-backend` job up. Verify network reachability between Prometheus and backend.
