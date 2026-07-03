# drivers — Backend Service

## Purpose

Driver entity: profile, KYC documents, vehicle info, online/offline status, real-time location, scoring (rating + completion rate), cooldown tracking. Source for dispatch driver pool. Gọi bởi: driver mobile (status toggle, location ping), dispatch (driver candidate query), admin (KYC approval).

## API surface

- `GET /driver/profile` — Current driver profile
- `PATCH /driver/profile` — Update vehicle, bank account
- `POST /driver/online` — Toggle online status
- `POST /driver/offline`
- `GET /driver/earnings?period=day|week|month` — Earnings breakdown
- `GET /driver/earnings/summary?period=7d|30d|90d` — Chart-ready driver payout ledger summary
- `GET /driver/ratings?star=1|2|3|4|5` — Visible delivery reviews and rating stats for the authenticated driver
- `GET /driver/heatmap?lat=...&lng=...&radius=...&window=now|1h|3h|today` — Real demand heatmap near driver location
- `GET /driver/incentives` — Driver incentive campaigns; returns empty arrays when no campaign source is configured
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
