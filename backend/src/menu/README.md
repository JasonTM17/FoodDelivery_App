# menu — Backend Service

## Purpose

Restaurant menu items: name, description, price, photos, category, variants, addons, allergens, availability flags. Restaurant owners CRUD their own menu; customers read public listings.

## API surface

- `GET /restaurants/:id/menu` — Public menu listing
- `GET /restaurants/:id/menu/:itemId` — Item detail
- `POST /restaurant/menu` — Owner create item
- `PATCH /restaurant/menu/:itemId` — Update (price, availability, variants)
- `DELETE /restaurant/menu/:itemId` — Soft-delete
- `POST /restaurant/menu/:itemId/photo` — Upload photo via MinIO presigned URL

## Env vars

| Name | Default | Description |
|---|---|---|
| `MENU_PHOTO_MAX_MB` | `5` | Max photo size |
| `MENU_ITEM_MAX_PER_RESTAURANT` | `500` | Hard cap |

## Test

```bash
npx jest menu
```

## Runbook

- **Out-of-stock:** Toggle `Item.available = false` → hidden from customer search.
- **Price change mid-order:** Order snapshots price at creation; subsequent menu price changes don't affect in-flight orders.
- **Photo orphan:** Soft-delete keeps photo blobs; cleanup cron `pnpm scripts:menu-photo-gc` removes blobs for items hard-deleted >30 days ago.
