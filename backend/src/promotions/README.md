# promotions — Backend Service

## Purpose

Promo code engine với eligibility rules (first-order, min order value, restaurant whitelist, time window), stacking rules (per-rule combinable flag), atomic `validateAndClaim` qua `FOR UPDATE` lock chống over-redemption, fraud detection (multi-account, IP density), Vietnamese-localized error messages. Gọi bởi: cart (apply promo), checkout (final claim), admin promo CRUD.

## API surface

- `POST /promotions/validate` — Dry-run validate + return discount amount
- `POST /promotions/claim` — Final claim atomically (prevents race)
- `GET /admin/promotions` — List với filter
- `POST /admin/promotions` — Create promo
- `PATCH /admin/promotions/:id` — Update
- `DELETE /admin/promotions/:id` — Soft-delete

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `FRAUD_IP_DENSITY_THRESHOLD` | no | `5` | Reject if N+ accounts from same IP claim same promo |
| `FRAUD_MULTI_ACCOUNT_WINDOW_HOURS` | no | `24` | Lookback window |

## Test

```bash
npx jest promotions
# Coverage gate: ≥ 80%
```

## Runbook

- **Promo over-redeemed (race):** `validateAndClaim` uses `FOR UPDATE` — should not happen. If observed, audit `Promotion.redemption_count` vs actual `OrderPromotion` rows.
- **Eligibility false-negative:** Check user attributes against rule predicate, may need admin manual override via `/admin/promotions/:id/grant`.
- **Fraud false-positive:** Whitelist via admin endpoint after manual review.
