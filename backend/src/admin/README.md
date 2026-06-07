# admin — Backend Service

## Purpose

Admin-only endpoints aggregated under `/admin/*` namespace. RBAC-gated (role: admin). Provides operational visibility (orders/users/restaurants/drivers list) and moderation actions (suspend/activate/refund). Read-heavy with audit logging on all mutations.

## API surface

- `GET /admin/orders` — All orders với filter (status, date range, restaurant)
- `GET /admin/users` — All users với filter (role, status, signup date)
- `GET /admin/restaurants` — Restaurant approval queue + active list
- `GET /admin/drivers` — Driver KYC queue + active drivers
- `GET /admin/audit-logs` — Mutation audit trail
- `POST /admin/refund/:orderId` — Trigger refund (delegates to payments service)
- `PATCH /admin/users/:id/status` — Suspend/reactivate
- `GET /admin/dispatch/metrics` — Real-time dispatch stats
- `GET /admin/promotions` — Promo CRUD

## Env vars

| Name | Default | Description |
|---|---|---|
| `ADMIN_AUDIT_RETENTION_DAYS` | `365` | Audit log retention |
| `ADMIN_EXPORT_BATCH_SIZE` | `1000` | CSV export pagination |

## Test

```bash
npx jest admin
```

## Runbook

- **Failed refund:** Inspect BullMQ `payment-refund` queue. Manual retry from admin UI.
- **Audit gap:** Every mutation MUST go through `AuditMiddleware`. Routes missing it logged as warning at startup.
- **Export timeout:** Large CSV exports stream via `Transfer-Encoding: chunked`; if browser drops, resume via cursor query param.
