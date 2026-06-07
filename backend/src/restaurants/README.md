# restaurants — Backend Service

## Purpose

Restaurant entity CRUD, geo search (PostGIS), opening hours, photos, ratings aggregation cached. Public read endpoints (customer browse) + restaurant-owner write endpoints (profile, hours, payout). Admin moderation. Gọi bởi: customer mobile (browse + nearby), restaurant web (profile/hours), admin (approval queue), promotions (whitelist eligibility).

## API surface

- `GET /restaurants/nearby?lat=&lng=&radius=` — PostGIS proximity search
- `GET /restaurants/:id` — Detail page
- `GET /restaurants/:id/menu` — Menu items
- `GET /restaurants/:id/reviews` — Public reviews
- `PATCH /restaurant/profile` — Owner update profile
- `PATCH /restaurant/hours` — Owner update opening hours
- `POST /admin/restaurants/:id/approve` — Admin moderation
- `POST /admin/restaurants/:id/suspend`

## Env vars

| Name | Default | Description |
|---|---|---|
| `RESTAURANT_SEARCH_RADIUS_KM` | `5` | Default nearby radius |
| `RESTAURANT_MAX_PHOTOS` | `8` | Max photos per restaurant |

## Test

```bash
npx jest restaurants
```

## Runbook

- **PostGIS index missing:** Run `prisma migrate deploy` to ensure GiST index on geom column.
- **Rating cache drift:** Run `pnpm scripts:rating-recalc` to rebuild from raw reviews.
- **Suspended:** Public endpoints exclude suspended restaurants automatically.
