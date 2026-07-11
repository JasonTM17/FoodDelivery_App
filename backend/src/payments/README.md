# payments — Backend Service

## Purpose

Payment intent lifecycle, SePay VietQR provider integration, webhook handling với HMAC verification, commission split snapshot at order creation, payout ledger, refund processor qua BullMQ. Gọi bởi: order placement (intent create), webhook controller (SePay confirm), refund processor (admin trigger), restaurant/driver payout schedule.

## API surface

- `POST /orders` — creates the order and, for `sepay`, returns its VietQR payment intent.
- `POST /webhooks/sepay/payment-success` — receives the official SePay bank-transaction payload with raw-body HMAC verification.
- Order cancellation and partial-fulfillment services enqueue `payment-refund` jobs only after a captured payment exists.
- BullMQ: `payment-refund`, `commission-split`, `payout-disbursement`.

## Runtime behavior

- `cash` releases the order to `restaurant_pending` with payment still pending; cash is collected after fulfillment.
- `wallet` is the only wallet API and database value; capture uses confirmed wallet balance and a debit `wallet_transactions` row. New wallet transaction references use the public `WALLET-*` prefix.
- `sepay` builds the documented `https://vietqr.app/img` URL from the configured beneficiary account, bank and exact VND amount. It does not call an undocumented intent endpoint.
- The order stays `pending_payment` until an inbound `transferType=in` webhook has a matching account, payment code and exact amount.
- HMAC verification uses the untouched request body and SePay's `{timestamp}.{raw_body}` signing message; timestamps outside ±5 minutes are rejected.
- `payment_webhook_receipts` stores SePay's stable transaction `id` behind a database unique constraint, so automatic retries and historical manual replays remain idempotent after cache expiry or process restarts.
- Valid signed transfers that are outbound, unmatched, wrong-account, wrong-amount, duplicated, late, or otherwise unreconcilable are acknowledged exactly as SePay requires and recorded as `ignored` or `manual_review`; they never become successful order payments silently.
- Late payments for cancelled/refunded orders are persisted in order history and alerted to admins for manual refund review; they never reopen or release the order.
- SePay bank-transfer refunds fail closed with `SEPAY_BANK_TRANSFER_REFUND_REQUIRES_MANUAL_REVIEW`. Card void APIs are not used for VietQR bank transfers.

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `SEPAY_ACCOUNT_NUMBER` | yes | — | FoodFlow beneficiary account or VA used by the VietQR image |
| `SEPAY_BANK_NAME` | yes | — | Official VietQR bank short name, alias, code or BIN |
| `SEPAY_WEBHOOK_SECRET` | yes | — | Rotated HMAC secret configured on the SePay webhook |
| `SEPAY_API_KEY` | no | — | Reserved for authenticated SePay API reconciliation; not used to generate VietQR |
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

- **Webhook signature mismatch:** Check the HMAC mode, rotated `SEPAY_WEBHOOK_SECRET`, timestamp header and raw-body preservation.
- **Webhook amount/account mismatch:** Inspect `payment_webhook_receipts`, compare the `payment_intents` row with SePay delivery logs and the configured beneficiary account, then resolve the audited review; never override the check in production.
- **Bank-transfer refund pending:** Inspect the failed `payment-refund` job and order history, then complete an audited manual bank refund before changing business status.
- **Commission split wrong:** Snapshot stored on `Order.commissionSnapshot` JSON field at order creation. If rate changes mid-flight, snapshot prevails.
- **Payout discrepancy:** Cross-reference `payout_ledger`, `payments`, `payment_intents`, order history and the SePay bank reference.
