# FoodFlow Product Gallery

## Overview

This gallery is generated from the current-source isolated Docker stack and its deterministic test seed. It does **not** claim that the shown pages are production deployments. Public Vercel URLs will be added only after final deploy and production smoke.

Capture manifest: `docs/screenshots/manifest.json`. Tool: `docs/scripts/capture-product-media.mjs`.

## Motion previews

| Flow | Preview |
|---|---|
| Admin sign-in → overview | ![Admin sign-in to overview](./media/gifs/admin-login-flow.gif) |
| Restaurant order queue → menu | ![Restaurant orders to menu](./media/gifs/restaurant-orders-to-menu.gif) |

GIFs are 640 × 400, silent, palette-optimized, and generated from the same screenshots/API session. Intermediate frames and concat manifests are removed automatically.

## Admin

### Admin sign-in

![Admin sign-in](./screenshots/admin/01-login.png)

### Admin overview

![Admin overview](./screenshots/admin/02-overview.png)

### Admin orders

![Admin orders](./screenshots/admin/03-orders.png)

### Admin restaurants

![Admin restaurants](./screenshots/admin/04-restaurants.png)

### Admin users

![Admin users](./screenshots/admin/05-users.png)

### Admin drivers

![Admin drivers](./screenshots/admin/06-drivers.png)

### Admin promotions

![Admin promotions](./screenshots/admin/07-promotions.png)

### Admin support

![Admin support](./screenshots/admin/08-support.png)

### Admin analytics

![Admin analytics](./screenshots/admin/09-analytics.png)

### Admin settings

![Admin settings](./screenshots/admin/10-settings.png)

## Restaurant

### Restaurant sign-in

![Restaurant sign-in](./screenshots/restaurant/01-login.png)

### Restaurant dashboard

![Restaurant dashboard](./screenshots/restaurant/02-dashboard.png)

### Restaurant order queue

![Restaurant order queue](./screenshots/restaurant/03-orders.png)

### Restaurant menu

![Restaurant menu](./screenshots/restaurant/04-menu.png)

### Restaurant promotions

![Restaurant promotions](./screenshots/restaurant/05-promotions.png)

### Restaurant revenue

![Restaurant revenue](./screenshots/restaurant/06-revenue.png)

### Restaurant reviews

![Restaurant reviews](./screenshots/restaurant/07-reviews.png)

### Restaurant staff

![Restaurant staff](./screenshots/restaurant/08-staff.png)

### Restaurant insights

![Restaurant insights](./screenshots/restaurant/09-insights.png)

### Restaurant settings

![Restaurant settings](./screenshots/restaurant/10-settings.png)

## Capture procedure

1. Build the base + `docker-compose.e2e.yml` stack from the target source head.
2. Apply all migrations and run the deterministic non-production seed.
3. Require API/Admin/Restaurant health 200.
4. Use the overlay's configured `localhost` origins; `127.0.0.1` is intentionally a CORS error-state origin.
5. Authenticate through the real API, inject only short-lived local session state, and visit each route with Playwright Chromium.
6. Render PNG files and palette-optimized GIFs through FFmpeg.
7. Visually inspect every output for error states, stale data, mixed locale, clipping, secret exposure, and console/network failures.

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build

$env:FOODFLOW_ADMIN_URL='http://localhost:13000'
$env:FOODFLOW_RESTAURANT_URL='http://localhost:13002'
$env:FOODFLOW_API_URL='http://localhost:13001/api'
node docs/scripts/capture-product-media.mjs

Remove-Item Env:FOODFLOW_ADMIN_URL,Env:FOODFLOW_RESTAURANT_URL,Env:FOODFLOW_API_URL
```

The script prints origins and file names, never access/refresh tokens or provider secrets. The manifest records capture time, origins, and seed identities only.

## Visual QA status

- The initial 2026-07-10 capture through `127.0.0.1` correctly showed CORS failures and was discarded.
- The accepted capture source uses `localhost` and loads real seeded API data.
- The Admin overview KPI locale and contrast findings were fixed, verified in vi/en/ja on Chromium and Firefox with axe serious/critical = 0, and recaptured in the accepted media.
- Maps use the keyless MapLibre/OpenFreeMap basemap. A blank/error map or missing backend GPS/route must not be edited into a successful screenshot.
- Empty order columns are valid only when the API response proves that state; capture must not hide errors as emptiness.

## Media review checklist

- Correct locale in visible text, metadata, and `html lang`.
- No email/token/key/credential beyond intentional non-secret test identities.
- No `Failed to fetch`, provider error, 404 shell, or loading skeleton.
- Real API counts/items; no runtime random/mock fallback.
- Responsive crop, readable text, no clipped dialogs/menus.
- GIF transition tells one clear flow and ends on a stable page.
- File weight remains reasonable for GitHub README rendering.

## Related documentation

- [Docker/local guide](docker-local-dev-guide.md)
- [Testing guide](testing-guide.md)
- [Design guidelines](design-guidelines.md)
- [Release report](batch4-release-report.md)
