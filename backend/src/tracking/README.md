# tracking — Backend Service

## Purpose

Realtime GPS tracking + routed ETA computation. Driver location ingest qua WebSocket, anti-spoofing detection (speed jump > 150 km/h, GPS hopping), batch flush to PostGIS, Google Directions / OSRM provider abstraction với polyline persist + deviation-triggered ETA recompute (BullMQ). Gọi bởi: driver mobile (location ping), customer mobile (subscribe), admin tracking dashboard.

## API surface

- `WebSocket /tracking` — Driver pushes location updates, customer subscribes
- `GET /orders/:id/tracking` — Cache-first route/ETA snapshot for the authenticated customer
- BullMQ: `tracking-eta` recompute queue
- Internal: `getOrFetchRoute(origin, dest, phase)` provider with Google primary + OSRM router fallback. If no routed provider succeeds, the WebSocket emits `etaMinutes: null`, `source: "route_unavailable"`, and no polyline instead of fabricating straight-line minutes.

## Route phases

- `driver_assigned` / `driver_arriving_restaurant` use `pickup` phase and route the driver to the restaurant.
- `picked_up` / `delivering` use `dropoff` phase and route the driver to the customer address.
- Redis route keys include the phase (`route:<orderId>:pickup` or `route:<orderId>:dropoff`) so a restaurant-bound polyline is never reused as the customer-bound route.
- Provider routes persist to `delivery_tasks` by phase: pickup routes update `pickup_distance_km`, dropoff routes update `delivery_distance_km`, and both phases update real `duration_in_traffic` + `route_geojson`.
- `delivery:eta_updated` includes `{ orderId, etaMinutes, source, degraded, routePolyline, routePhase }`; mobile must draw `routePolyline` only when present and keep telemetry trail separate.

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | production | — | Directions API key (preferred) |
| `OSRM_URL` | production | `https://router.project-osrm.org` in local/test only | Owned fallback router; production rejects the public OSRM demo |
| `LOCATION_FLUSH_INTERVAL_MS` | no | `15000` | Batch DB flush cadence |
| `ETA_CACHE_TTL_SEC` | no | `120` | Redis TTL for ETA snapshot |
| `ROUTE_DEVIATION_THRESHOLD_M` | no | `100` | Trigger recompute if driver off route > N meters |

Production requires both `GOOGLE_MAPS_API_KEY` and an owned `OSRM_URL`; the backend fails closed instead of using the public OSRM demo service in production.

## Run locally

```bash
cd backend
pnpm start:dev
# WebSocket: ws://localhost:3001/tracking
```

## Test

```bash
npx jest tracking
# 41/41 tracking tests cover provider fallback, phase-aware destination selection, no fabricated ETA, snap-to-line, and deviation recompute
```

## Runbook

- **GPS spoofing alerts:** Inspect `driver_location_anomaly` table. Auto-flag drivers with > 3 anomalies/hour for review.
- **ETA cache stale:** `DEL route:<orderId>:pickup` or `DEL route:<orderId>:dropoff` to force phase-specific recompute.
- **Directions API quota:** Monitor `directions_api_calls_total{provider="google"}` Prometheus metric. Switch to OSRM-primary if quota exceeded.
- **Open handle warning on shutdown:** `TrackingService.onModuleDestroy` clears `flushInterval` — verify nếu test logs warning.
