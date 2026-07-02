# webhooks — Backend Service

## Purpose

Inbound webhook receivers for third-party services. HMAC-verified entry points: SePay payment success, FCM delivery reports, Twilio status callbacks. All webhooks idempotent (dedup via `(provider, eventId)` Redis key).

## API surface

- `POST /webhooks/sepay/payment-success` — SePay VietQR confirm callback
- `POST /webhooks/twilio/status` — SMS delivery status (delivered, failed, undelivered)
- `POST /webhooks/fcm/delivery` — Push delivery report (optional, for analytics)

## Env vars

| Name | Required | Description |
|---|---|---|
| `SEPAY_WEBHOOK_SECRET` | yes | HMAC SHA256 secret matching SePay merchant config |
| `TWILIO_AUTH_TOKEN` | yes | Used for Twilio signature validation |
| `WEBHOOK_DEDUP_TTL_HOURS` | no | Idempotency Redis TTL (default 24h) |

## Test

```bash
npx jest webhooks
```

## Runbook

- **Signature mismatch:** Logs raw payload to `webhook_audit` for forensics; returns 401 (provider will retry).
- **Missing SePay secret:** `POST /webhooks/sepay/payment-success` rejects requests when `SEPAY_WEBHOOK_SECRET` is unset; configure the secret before enabling SePay in runtime.
- **Replay attack:** Rejected by Redis dedup key `wh:dedup:{provider}:{eventId}`. TTL window prevents legitimate retries from being blocked.
- **Provider rotation:** Update env secret + redeploy. Old in-flight webhooks fail signature, will retry per provider policy.
- **SePay timeout:** SePay retries 3x with backoff. Backend must complete idempotent operation within 10s SLA.
