# notifications — Backend Service

## Purpose

Multi-channel notification fanout (in-app WebSocket + FCM push + SMTP email + Twilio SMS) với template loader đa locale (vi-VN, en-US, ja-JP), idempotency dedup, quiet hours suppression cho non-critical events, BullMQ orchestration. User locale propagated từ `User.preferredLocale` field. Gọi bởi: order events, dispatch events, payment events, AI escalation, promotion campaigns, admin alerts.

## API surface

- `POST /users/notifications/fcm-token` — Register FCM token (per-device)
- `DELETE /users/notifications/fcm-token` — Unregister
- `GET /notifications` — List user notifications (paginated)
- `PATCH /notifications/:id/read` — Mark single as read
- `PATCH /notifications/read-all` — Mark all read
- `GET /admin/notification-settings/:userId` — Per-event channel preferences
- WebSocket: `notification:new` event
- BullMQ channels: `notif-fcm`, `notif-smtp`, `notif-twilio`

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `FCM_SERVICE_ACCOUNT_JSON` | yes | — | Firebase admin SDK service account |
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

- **FCM token stale:** Cleanup job `pnpm scripts:fcm-cleanup` removes tokens với `lastSeenAt < now - 60d`.
- **SMTP rate limited:** Check `notification_audit` for spike. Spread fanout via BullMQ delay.
- **SMS cost overrun:** Twilio is fallback only — monitor `twilio_sends_total` metric. Default channel preference excludes SMS.
- **Locale fallback:** Missing `en-US/<event>.json` → loader falls back to `vi-VN/`. Add new template before claiming locale support.
- **Critical event miss quiet-hour:** `CRITICAL_EVENTS` Set in `notifications.constants.ts` — only payment_failed, order_cancelled bypass quiet.
