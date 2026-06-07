# reviews — Backend Service

## Purpose

Customer reviews cho food + driver, restaurant reply thread, aggregation pipeline (running average rating), photo upload qua MinIO presigned URL, profanity moderation, anti-spam (1 review/order, only after delivered, within 7 days). Gọi bởi: customer mobile (review submit), restaurant web (reply), admin (moderation).

## API surface

- `POST /orders/:id/review` — Customer submit review (food rating + delivery rating + comment + photos)
- `POST /restaurant/reviews/:id/reply` — Restaurant reply (1 reply, edit window 24h)
- `PATCH /admin/reviews/:id/hide` — Admin moderate
- `GET /restaurants/:id/reviews` — Public list
- `GET /drivers/:id/reviews` — Per driver

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `REVIEW_WINDOW_DAYS` | no | `7` | Days after delivered to allow review |
| `REVIEW_REPLY_EDIT_HOURS` | no | `24` | Restaurant reply edit window |
| `REVIEW_PHOTO_MAX_COUNT` | no | `4` | Max photos per review |
| `REVIEW_PHOTO_MAX_MB` | no | `2` | Max size per photo |

## Test

```bash
npx jest reviews
# Coverage gate: ≥ 80%
```

## Runbook

- **Aggregation drift:** Run `pnpm scripts:reviews-recalc` để rebuild restaurant.rating_avg from raw reviews.
- **Photo upload fails:** Check MinIO presigned URL TTL, verify bucket policy.
- **Moderation queue:** Profanity filter flags entries → admin review tab.
