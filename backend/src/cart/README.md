# cart — Backend Service

## Purpose

Customer cart state per user. Tracks selected food items, quantities, special instructions, applied promo codes. Single active cart per user (one restaurant at a time enforced). Gọi bởi: customer mobile (add/update/remove items), checkout flow (validate before order create), promotion service (apply code).

## API surface

- `GET /cart` — Current user cart
- `POST /cart/items` — Add item with options/note
- `PATCH /cart/items/:itemId` — Update quantity/options
- `DELETE /cart/items/:itemId` — Remove single item
- `DELETE /cart` — Clear cart
- `POST /cart/promo` — Apply promo code (calls promotions service)

## Env vars

| Name | Default | Description |
|---|---|---|
| `CART_TTL_HOURS` | `24` | Auto-expire idle cart after N hours |

## Run locally

```bash
cd backend
pnpm start:dev
```

## Test

```bash
npx jest cart
```

## Runbook

- **Cart cross-restaurant conflict:** Service rejects add-item if restaurantId differs from existing cart. Error message via `i18n.t('errors.cart.cross_restaurant')`. Customer must clear cart first.
- **Stale cart:** Cleanup cron removes carts where `updatedAt < now - CART_TTL_HOURS`.
- **Promo recalc:** When item changes affect promo eligibility (e.g. min order), `validatePromo` re-checks atomically.
