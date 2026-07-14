# FoodFlow Product Gallery

## Overview

This is a historical non-production gallery. `docs/screenshots/manifest.json` records `capturedAt` 2026-07-10 but no source SHA, Compose reference, or image reference; the media therefore does **not** prove the current source head, a final Docker build, or a production deployment. Public Vercel URLs require final deployment and production smoke.

Capture manifest: `docs/screenshots/manifest.json`. Tool: `docs/scripts/capture-product-media.mjs`. A new release-use capture must record its source commit plus the Compose/image references and whether it was run from a clean final head or a dirty workspace.

## Surface coverage

| Surface | Product | Stored visual media | Evidence boundary |
|---|---|---|---|
| Admin | Next.js web dashboard | Historical stills and GIF | Non-production web media only. |
| Restaurant | Next.js web dashboard | Historical stills and GIF | Non-production web media only. |
| Customer | Flutter/Riverpod native Android/iOS app; Android `customer` flavor | None | No Customer still is stored; source documentation is not visual or release evidence. |
| Driver | Flutter/Riverpod native Android/iOS app; Android `driver` flavor | Two test-only Android API 35 assets | Simulated GPS/permission local evidence only; not a mobile release, Supabase, Railway, or production proof. |

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

## Customer

Customer is a first-class Flutter/Riverpod native Android/iOS product. Start it from [`main_customer.dart`](../mobile/lib/main_customer.dart) with the Android `customer` flavor. Its documented scope includes discovery, ordering, cart, checkout, tracking, and support; see the [mobile guide](../mobile/README.md) for runtime and build details.

For the complete verified Customer and Driver workflows, permissions, notification behavior, and explicit run commands, see the [Customer and Driver mobile guide](./customer-driver-guide.md).

No Customer UI still is currently stored in this gallery. Do not infer a Customer screenshot from Admin or Restaurant media; only a new capture from the explicit entrypoint with recorded source/runtime references can become visual release evidence.

## Driver GPS (test-only local E2E)

Driver is a first-class Flutter/Riverpod native Android/iOS product. Start it from [`main_driver.dart`](../mobile/lib/main_driver.dart) with the Android `driver` flavor. Its documented scope includes Online state, dispatch, GPS, route guidance, earnings, KYC, and notifications; see the [mobile guide](../mobile/README.md) for runtime and build details.

These test-only Android API 35 emulator images use only a simulated route and deterministic test data. They demonstrate the Driver's explicit Online action and the Android notification-permission flow; no real location, personal account, credential, or token was captured.

The associated local E2E check accepted the authenticated GPS command, refreshed Redis liveness, persisted the sample to PostGIS, and delivered one authorized Admin Socket.IO event. This is local Socket.IO compatibility evidence only, **not** Supabase, Railway, Vercel, or production evidence.

### Driver Online after GPS verification

![Driver Online after verified GPS update](./screenshots/driver/driver-online-gps-e2e.webp)

### Android foreground-tracking notification permission

![Android notification permission prompt for Driver tracking](./screenshots/gps/driver-notification-permission.webp)

## Capture procedure

1. Build the base + `docker-compose.e2e.yml` stack from the target source head.
2. Apply all migrations and run the deterministic non-production seed.
3. Require API/Admin/Restaurant health 200.
4. Use the overlay's configured `localhost` origins; `127.0.0.1` is intentionally a CORS error-state origin.
5. Authenticate through the real API, inject only short-lived local session state, and visit each route with Playwright Chromium.
6. Render PNG files and palette-optimized GIFs through FFmpeg.
7. Visually inspect every output for error states, stale data, mixed locale, clipping, secret exposure, and console/network failures.
8. For Driver GPS media, use an Android emulator with a simulated route, verify the command/presence/PostGIS/authorized-fanout chain, and review the output for coordinates or personal data before approval.

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build

$env:FOODFLOW_ADMIN_URL='http://localhost:13000'
$env:FOODFLOW_RESTAURANT_URL='http://localhost:13002'
$env:FOODFLOW_API_URL='http://localhost:13001/api'
node docs/scripts/capture-product-media.mjs

Remove-Item Env:FOODFLOW_ADMIN_URL,Env:FOODFLOW_RESTAURANT_URL,Env:FOODFLOW_API_URL
```

The script prints origins and file names, never access/refresh tokens or provider secrets. The current manifest records capture time, origins, and seed identities only; attach source and runtime references before treating a new capture as release evidence.

## Historical QA record and recapture boundary

- The 2026-07-10 capture through `127.0.0.1` correctly showed CORS failures and was discarded. The retained historical capture used `localhost` with seeded API data.
- The recorded Admin overview KPI locale and contrast issue was fixed before the historical vi/en/ja Chromium/Firefox review. That record must not be read as a current browser-E2E or final-head result.
- Existing media stays historical until it is recaptured from the committed release candidate and its source/runtime references are recorded. A capture from a dirty workspace is runtime evidence only, never release proof.
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
