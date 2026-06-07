# tracking — Backend Service

## Purpose

Realtime GPS tracking + ETA computation. Driver location ingest qua WebSocket, anti-spoofing detection (speed jump > 200 km/h, GPS hopping), batch flush to PostGIS, Google Directions / OSRM provider abstraction với polyline persist + deviation-triggered ETA recompute (BullMQ). Gọi bởi: driver mobile (location ping), customer mobile (subscribe), admin tracking dashboard.

## API surface

- `WebSocket /tracking` — Driver pushes location updates, customer subscribes
- `GET /tracking/:orderId/eta` — Cache-first ETA snapshot
- `GET /tracking/:orderId/route` — Persisted polyline + waypoints
- BullMQ: `tracking-eta` recompute queue
- Internal: `getOrFetchRoute(origin, dest)` provider with Google + OSRM fallback

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | no | — | Directions API key (preferred) |
| `OSRM_URL` | no | `https://router.project-osrm.org` | Fallback router |
| `LOCATION_FLUSH_INTERVAL_MS` | no | `15000` | Batch DB flush cadence |
| `ETA_CACHE_TTL_SEC` | no | `120` | Redis TTL for ETA snapshot |
| `ROUTE_DEVIATION_THRESHOLD_M` | no | `100` | Trigger recompute if driver off route > N meters |

## Run locally

```bash
cd backend
pnpm start:dev
# WebSocket: ws://localhost:3001/tracking
```

## Test

```bash
npx jest tracking
# 26/26 tests covering provider fallback, snap-to-line, deviation
```

## Runbook

- **GPS spoofing alerts:** Inspect `driver_location_anomaly` table. Auto-flag drivers with > 3 anomalies/hour for review.
- **ETA cache stale:** `DEL eta:order:<id>` to force recompute.
- **Directions API quota:** Monitor `directions_api_calls_total{provider="google"}` Prometheus metric. Switch to OSRM-primary if quota exceeded.
- **Open handle warning on shutdown:** `TrackingService.onModuleDestroy` clears `flushInterval` — verify nếu test logs warning.
