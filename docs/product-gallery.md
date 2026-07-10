# FoodFlow Product Gallery

Real product screenshots and short motion GIFs captured from the live Admin and Restaurant web apps (Vercel production UI) backed by a seeded NestJS API.

> Capture tooling: [`docs/scripts/capture-product-media.mjs`](./scripts/capture-product-media.mjs)
> Assets live under [`docs/screenshots/`](./screenshots/) and [`docs/media/gifs/`](./media/gifs/).

## Live demos

| Surface | Public URL |
|---------|------------|
| Admin | [food-delivery-app-one-liard.vercel.app](https://food-delivery-app-one-liard.vercel.app/vi/login) |
| Restaurant | [foodflow-restaurant.vercel.app](https://foodflow-restaurant.vercel.app/vi/login) |

API is deployed separately (Docker Hub images / tunnel / VPS) — **not** on Vercel.

## Motion previews

### Admin login flow

![Admin login flow](./media/gifs/admin-login-flow.gif)

### Restaurant navigation (orders → menu)

![Restaurant orders to menu](./media/gifs/restaurant-orders-to-menu.gif)

## Admin dashboard

### Sign-in

![Admin login](./screenshots/admin/01-login.png)

Clean email/password form with locale switcher, remember-me, and password recovery.

### Overview KPIs

![Admin overview](./screenshots/admin/02-overview.png)

Platform KPIs (revenue, orders, active users, restaurants, online drivers) plus analytics panels.

### Orders

![Admin orders](./screenshots/admin/03-orders.png)

### Restaurants

![Admin restaurants](./screenshots/admin/04-restaurants.png)

Seeded partner list with owner, cuisine, rating, order totals, and active status.

### Users

![Admin users](./screenshots/admin/05-users.png)

Real names and active/banned status mapped from backend `fullName` / `isActive`.

### Drivers

![Admin drivers](./screenshots/admin/06-drivers.png)

### Promotions

![Admin promotions](./screenshots/admin/07-promotions.png)

### Support

![Admin support](./screenshots/admin/08-support.png)

Ticket inbox with SLA-aware status; assign-self maps to the signed-in admin.

### Analytics

![Admin analytics](./screenshots/admin/09-analytics.png)

## Restaurant portal

### Sign-in

![Restaurant login](./screenshots/restaurant/01-login.png)

Partner-facing login with warm brand surface.

### Dashboard

![Restaurant dashboard](./screenshots/restaurant/02-dashboard.png)

### Order queue (kanban)

![Restaurant orders](./screenshots/restaurant/03-orders.png)

### Menu management (seeded catalog)

![Restaurant menu](./screenshots/restaurant/04-menu.png)

Categories, prices (VND), availability toggles, and photo-ready rows.

### Promotions

![Restaurant promotions](./screenshots/restaurant/05-promotions.png)

### Revenue

![Restaurant revenue](./screenshots/restaurant/06-revenue.png)

### Reviews

![Restaurant reviews](./screenshots/restaurant/07-reviews.png)

### Staff

![Restaurant staff](./screenshots/restaurant/08-staff.png)

### Insights

![Restaurant insights](./screenshots/restaurant/09-insights.png)

## How media was captured

1. Seeded local Postgres via `pnpm run db:seed` (`admin@foodflow.vn` / `Admin@123`, `restaurant1@foodflow.vn` / `Partner@123`).
2. Public Nest API exposed to the browser (Docker + Cloudflare Tunnel for demo, or permanent VPS).
3. Admin + Restaurant built and hosted on Vercel production.
4. Playwright Chromium script injects session tokens, visits each locale route, waits for network idle, writes PNG + assembles GIF with `ffmpeg`.

Re-run:

```bash
# stack + seed + public API first
cd web && pnpm exec playwright install chromium
node docs/scripts/capture-product-media.mjs
# optional overrides:
# FOODFLOW_ADMIN_URL=... FOODFLOW_RESTAURANT_URL=... FOODFLOW_API_URL=.../api
```

## Notes for reviewers

- Prefer the **`one-liard`** Admin alias; some team-scoped Vercel hostnames enforce SSO Deployment Protection.
- Some admin list endpoints may return empty/error states if the API revision and seed schema diverge — gallery prioritizes routes verified green in the latest capture.
- Maps require a real `NEXT_PUBLIC_GOOGLE_MAPS_KEY`; map pages may show empty map chrome without it.
- GIFs are intentionally short and silent for README preload weight.

## Related docs

- [Deployment guide](./deployment-guide.md)
- [Docker local dev](./docker-local-dev-guide.md)
- [API contract](./api-contract.md)
- [System architecture](./system-architecture.md)
