# orders — Backend Service

## Purpose

Quản lý vòng đời đơn hàng FoodFlow từ tạo → giao → hoàn tiền. State machine 14 trạng thái với advisory lock chống race, cancellation policy theo actor (customer/restaurant/admin), partial fulfillment, refund qua BullMQ, auto-timeout processor. Gọi bởi: customer mobile, restaurant web, admin web, dispatch service (driver assign), payments (refund flow).

## API surface

- `POST /orders` — Customer place order (Zod validate, `X-Idempotency-Key` required)
- `GET /orders` — List orders với pagination + filter
- `GET /orders/:id` — Order detail
- `GET /orders/:id/tracking` — Status + driver location snapshot
- `POST /orders/:id/cancel` — Cancel với policy check (per-actor allowed-state matrix)
- `POST /orders/:id/refund` — Trigger refund processor (admin only)
- `PATCH /orders/:id/status` — Restaurant/driver state transitions (with audit)
- `POST /orders/:id/partial-fulfill` — Restaurant report missing items
- WebSocket: `order:status:changed`, `order:created` events
- Schemas: `orders.zod.ts`, `orders.dto.ts`

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `ORDER_AUTO_TIMEOUT_MIN` | no | `30` | Cancel if restaurant không accept trong N phút |
| `ORDER_PARTIAL_REFUND_FACTOR` | no | `1.0` | Multiplier áp dụng khi refund partial |
| `IDEMPOTENCY_TTL_HOURS` | no | `24` | Reject duplicate `X-Idempotency-Key` window |

## Run locally

```bash
cd backend
pnpm start:dev
# /api/orders/...
```

## Test

```bash
npx jest orders
# Coverage gate: ≥ 90% (critical)
```

## Runbook

- **Stuck order (status not transitioning):** Check `order_audit` table for last transition timestamp. Manual transition via admin endpoint với audit reason.
- **Refund failed:** Inspect BullMQ `payment-refund` queue. Failed jobs retry with exponential backoff; successful full refunds update the payment and order only after the provider or wallet ledger reversal succeeds.
- **Idempotency collision:** Customer retry → backend dedup. Stale key sau `IDEMPOTENCY_TTL_HOURS`.
- **Auto-timeout misfire:** Verify worker `order-timeout` queue consumer running.
- **Partial fulfill price recalc:** Dùng `prisma.$transaction` đảm bảo atomic.
