# payments — Backend Service

## Purpose

Payment intent lifecycle, SePay VietQR provider integration, webhook handling với HMAC verification, commission split snapshot at order creation, payout ledger, refund processor qua BullMQ. Gọi bởi: order placement (intent create), webhook controller (SePay confirm), refund processor (admin trigger), restaurant/driver payout schedule.

## API surface

- `POST /payments/intent` — Create payment intent (returns SePay QR)
- `POST /webhooks/sepay/payment-success` — SePay webhook (HMAC-verified)
- `GET /payments/:intentId` — Intent status
- `POST /admin/payments/:id/refund` — Trigger refund processor
- `GET /admin/payouts/ledger` — Payout history per restaurant/driver
- BullMQ: `payment-refund`, `commission-split`, `payout-disbursement`

## Runtime behavior

- `cash` releases the order to `restaurant_pending` with payment still pending; cash is collected after fulfillment.
- `wallet` is the only public wallet API value; capture uses confirmed wallet balance and a debit `wallet_transactions` row. The legacy Prisma enum remains an internal storage detail until the dedicated payment enum migration.
- `sepay` creates a real provider payment intent and keeps the order in `pending_payment` until the signed SePay webhook confirms payment.
- Missing `SEPAY_API_KEY` or `SEPAY_WEBHOOK_SECRET` is a degraded configuration error. Runtime must not create mock intents, mock refunds, or accept unsigned SePay webhooks.

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `SEPAY_WEBHOOK_SECRET` | yes | — | HMAC secret cho webhook verification |
| `SEPAY_BANK_CODE` | yes | — | Bank acquiring account |
| `SEPAY_ACCOUNT_NUMBER` | yes | — | FoodFlow merchant account |
| `COMMISSION_RATE_RESTAURANT` | no | `0.20` | 20% restaurant commission |
| `COMMISSION_RATE_DRIVER_BASE` | no | `0.15` | Base driver commission |
| `PAYOUT_SCHEDULE_DAY` | no | `1` | Day-of-month payouts run |

## Run locally

```bash
cd backend
pnpm start:dev
# Worker: pnpm worker (refund/commission/payout queues)
```

## Test

```bash
npx jest payments
npx jest sepay.provider
# Coverage gate: ≥ 90% (critical)
```

## Runbook

- **Webhook signature mismatch:** Check `SEPAY_WEBHOOK_SECRET` matches SePay merchant config. View raw payload in `payment_intent_audit` table.
- **Refund stuck:** Inspect BullMQ `payment-refund`. Manual retry via admin endpoint.
- **Commission split wrong:** Snapshot stored on `Order.commissionSnapshot` JSON field at order creation. If rate changes mid-flight, snapshot prevails.
- **Payout discrepancy:** Cross-reference `payout_ledger` with `payment_intent` records. Rebuild ledger via `pnpm run payouts:rebuild` (read-only audit script).
