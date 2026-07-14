# notifications — Backend Service

## Purpose

Multi-channel notification fanout (in-app WebSocket + FCM push + SMTP email + Twilio SMS) với template loader đa locale (vi-VN, en-US, ja-JP), idempotency dedup, quiet hours suppression cho non-critical events, BullMQ orchestration. User locale propagated từ `User.preferredLocale` field. Gọi bởi: order events, dispatch events, payment events, AI escalation, promotion campaigns, admin alerts.

## API surface

- `POST /notifications/fcm-token` — Register an FCM token (per device) with a client-generated `registrationId`; a temporary legacy body without it is accepted during the mobile upgrade window
- `DELETE /notifications/fcm-token` — Unregister one token owned by the authenticated user; provide both `token` and `registrationId` in the JSON body
- `DELETE /notifications/fcm-token/:token` — Temporary deprecated legacy cleanup route; remove only after a minimum mobile version is enforced
- `GET /notifications` — List user notifications (paginated)

FCM register/unregister requests carry the same client-generated UUID
`registrationId`. The service serializes operations for a token and applies a
seven-day effective revocation tombstone, so a late registration cannot
recreate a binding that logout revoked. Every registration or cleanup request
also removes expired tombstones using the expiry index; an external retention
job is still appropriate if the service can remain dormant for long periods.
The legacy cleanup route also removes only the matching historical `NULL`
registration binding, never a newer UUID registration for the same token.
- `PATCH /notifications/:id/read` — Mark single as read
- `PATCH /notifications/read-all` — Mark all read
- `GET /admin/notification-settings/:userId` — Per-event channel preferences
- WebSocket: `notification:new` event
- BullMQ channels: `notif-fcm`, `notif-smtp`, `notif-twilio`

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `FCM_PROJECT_ID` | yes in production | — | Firebase project ID used by FCM HTTP v1 |
| `FCM_SERVICE_ACCOUNT_JSON` | no | Application Default Credentials | One-line Firebase service-account JSON from a secret manager; leave blank only when ADC/workload identity is configured |
| `SMTP_HOST` | yes | — | SMTP server |
| `SMTP_USER` / `SMTP_PASS` | yes | — | SMTP credentials |
| `SMTP_FROM` | no | `noreply@foodflow.vn` | From address |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | yes | — | Twilio credentials |
| `TWILIO_FROM_NUMBER` | yes | — | Twilio sender |
| `QUIET_HOUR_START` | no | `22` | Suppress non-critical push 22:00 → |
| `QUIET_HOUR_END` | no | `7` | → 07:00 |
| `DEDUP_TTL_SECONDS` | no | `60` | Idempotency window |

## Run locally

```bash
cd backend
pnpm start:dev
pnpm worker  # in another terminal — runs BullMQ processors
```

## Test

```bash
npx jest notifications
```

## Runbook

- **FCM credentials:** The worker uses Firebase Admin SDK/HTTP v1, not `FCM_SERVER_KEY`. In Railway, set `FCM_PROJECT_ID` and a sealed JSON service account unless workload identity is available. Self-hosted Compose requires the JSON for both API and worker. Verify a deploy with a controlled device token; never paste JSON into logs, docs, or a shell transcript.
- **FCM provider error:** A rejected provider call is rethrown so the queue retries it. Per-token failures do not retry the whole batch; only `messaging/registration-token-not-registered` and `messaging/invalid-registration-token` mark a token stale.
- **FCM token stale:** The worker marks provider-confirmed invalid tokens stale. There is no repository cleanup command; retain or purge stale records through an explicitly reviewed operational job.
- **SMTP rate limited:** Check `notification_audit` for spike. Spread fanout via BullMQ delay.
- **SMS cost overrun:** Twilio is fallback only — monitor `twilio_sends_total` metric. Default channel preference excludes SMS.
- **Locale fallback:** Missing `en-US/<event>.json` → loader falls back to `vi-VN/`. Add new template before claiming locale support.
- **Critical event miss quiet-hour:** `CRITICAL_EVENTS` Set in `notifications.constants.ts` — only payment_failed, order_cancelled bypass quiet.
