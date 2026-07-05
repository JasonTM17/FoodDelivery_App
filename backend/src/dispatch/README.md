# dispatch — Backend Service

## Purpose

Driver dispatch engine — match orders to drivers via Redis GEOADD nearby search, weighted scoring (rating × completion-rate × proximity × cooldown), surge multiplier per zone, atomic claim với advisory lock chống double-assign. Gọi bởi: order processor (sau payment confirm), admin manual reassign, BullMQ retry queue.

## API surface

- `POST /admin/dispatch/reassign/:orderId` — Admin force reassign (audit log)
- `POST /admin/dispatch/cancel/:orderId` — Cancel dispatch + return order to queue
- `GET /admin/dispatch/metrics` — Real-time queue stats, driver utilization, surge map
- BullMQ queues: `dispatch`, `dispatch-retry`
- WebSocket `/dispatch`: server emits `driver:new_order` with `{ orderId, offerToken, restaurantName, restaurantAddress, deliveryAddress, orderTotal, deliveryFee, distanceKm, timeoutSeconds, surgeMultiplier }`; drivers reply with `dispatch:accept` / `dispatch:reject` using `{ orderId, offerToken }`; server emits `driver:order_assigned` after assignment is persisted. The customer room `driver:assigned` event carries `{ driverId, etaMinutes: null }`; routed ETA must come from tracking `delivery:eta_updated` after Google/OSRM route data is available, not from speed-based distance heuristics.

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `DISPATCH_RADIUS_KM` | no | `5` | Driver search radius |
| `DISPATCH_OFFER_TTL_SEC` | no | `30` | Offer countdown before reassign |
| `DISPATCH_MAX_RETRIES` | no | `3` | Retry to next driver pool |
| `SURGE_MULTIPLIER_CAP` | no | `2.5` | Max surge multiplier |
| `DRIVER_COOLDOWN_SEC` | no | `120` | Cooldown after rejected offer |

## Run locally

```bash
cd backend
pnpm start:dev
# Worker: pnpm worker
```

## Test

```bash
npx jest dispatch
# Coverage gate: ≥ 90% (critical)
```

## Runbook

- **No drivers found:** Check Redis `drivers:active` GEO key. Ensure driver app heartbeat working.
- **Stuck dispatch (offer expired but no reassign):** Inspect BullMQ `dispatch-retry`. Manual trigger via admin endpoint.
- **Surge stuck on:** `DEL surge:<zone_id>` in Redis to reset multiplier.
- **Driver flagged by cooldown:** `ZREM driver_cooldown:active driver:<id>` để force release.
