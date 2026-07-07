# drivers — Backend Service

## Purpose

Driver entity: profile, KYC documents, vehicle info, online/offline status, real-time location, scoring (rating + completion rate), cooldown tracking. Source for dispatch driver pool. Gọi bởi: driver mobile (status toggle, location ping), dispatch (driver candidate query), admin (KYC approval).

## API surface

- `GET /driver/profile` — Current driver profile
- `PATCH /driver/profile` — Update vehicle, bank account
- `POST /driver/online` — Toggle online status
- `POST /driver/offline`
- `GET /driver/orders/active` — Newest active order assigned to the authenticated driver, or `null`
- `GET /driver/orders/history?fromDate=...&toDate=...&limit=...` — Terminal orders assigned to the authenticated driver
- `GET /driver/earnings?period=today|week|month` — Payout ledger earnings breakdown
- `GET /driver/earnings/summary?period=7d|30d|90d` — Chart-ready driver payout ledger summary
- `GET /driver/bank-accounts` / `POST /driver/bank-accounts` / `PATCH /driver/bank-accounts/:id/default` / `DELETE /driver/bank-accounts/:id` — Driver payout bank accounts scoped to the authenticated driver
- `POST /driver/onboarding/agreement` — Persist authenticated driver terms acceptance before KYC submission
- `POST /driver/trips/:tripId/tip-report` — Driver-reported cash tip audit record for completed trips; does not mutate payout ledger settlement
- `GET /driver/ratings?star=1|2|3|4|5` — Visible delivery reviews and rating stats for the authenticated driver
- `GET /driver/trips/:tripId/route` — Real telemetry or persisted route geometry for the authenticated driver's trip; marks `routeSource` and `timestampEstimated` so clients can distinguish GPS history from persisted geometry
- `GET /driver/heatmap?lat=...&lng=...&radius=...&window=now|1h|3h|today` — Real demand heatmap near driver location
- `GET /driver/incentives` — Driver incentive campaigns from persisted `driver_incentive_campaigns`; progress is computed from the authenticated driver's delivered tasks in each campaign window, so empty arrays mean no matching persisted campaigns rather than fake-empty campaign data
- `POST /driver/kyc/upload` — Submit KYC documents
- `GET /admin/drivers/pending-kyc` — Admin approval queue
- `POST /admin/drivers/:id/approve-kyc`

## Env vars

| Name | Default | Description |
|---|---|---|
| `DRIVER_OFFLINE_TIMEOUT_MIN` | `5` | Auto-offline if no heartbeat |
| `DRIVER_KYC_RETRY_LIMIT` | `3` | Max KYC submissions before manual review |

## Test

```bash
npx jest drivers
```

## Runbook

- **Driver stuck online:** `DEL drivers:active driver:<id>` from Redis to force offline.
- **KYC document rejected:** Admin sets reason; driver receives FCM notification, can re-upload.
- **Score drift:** Driver score recalculated nightly via `pnpm scripts:driver-score-recalc`.
