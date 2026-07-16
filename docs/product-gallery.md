# FoodFlow Product Gallery

## Overview

This privacy-reviewed gallery deliberately mixes three labelled evidence classes: local regression media, historical controlled-production web media, and bounded Driver production-emulator recovery media. `docs/screenshots/manifest.json` records source heads, capture times, runtime context, dirty-workspace boundaries, and SHA-256 for every asset. No image by itself proves a clean release head, a final Docker build, a current production journey, physical-device behavior, or app-store readiness.

Capture manifest: `docs/screenshots/manifest.json`. Tool: `docs/scripts/capture-product-media.mjs`. A new release-use capture must record its source commit plus the Compose/image references and whether it was run from a clean final head or a dirty workspace.

## Surface coverage

| Surface | Product | Stored visual media | Primary guide | Evidence boundary |
|---|---|---|---|---|
| Admin | Next.js web dashboard | 10 local PNG stills, one GIF, and one historical production PNG | [Admin guide](./admin-guide.md) | Local Chrome regression plus separately labelled SHA `17584153` controlled-production evidence; not current-revision certification. |
| Restaurant | Next.js web dashboard | 10 local PNG stills, one GIF, and one historical production PNG | [Restaurant guide](./restaurant-guide.md) | Local Chrome regression plus separately labelled SHA `17584153` controlled-production evidence; public current access remains behind Vercel SSO. |
| Customer | Flutter/Riverpod native Android/iOS app; Android `customer` flavor | One privacy-reviewed local WebP still and one public-auth GIF | [Customer guide](./customer-guide.md) | Android AVD app-launch/public-auth evidence only; authenticated stills with exact coordinates were excluded. |
| Driver | Flutter/Riverpod native Android/iOS app; Android `driver` flavor | Six local WebP stills, one production-emulator recovery WebP, two tracking/permission assets, and one GIF | [Driver guide](./driver-guide.md) | Local Android AVD role/GPS evidence plus one separately labelled Railway/Supabase production-emulator capture; not physical-device, iOS, FCM, payout, or app-store proof. |

## Choose a role guide

- [Admin](./admin-guide.md): platform operations, support, reports, exports, and settings.
- [Restaurant](./restaurant-guide.md): order queue, menu, staff, revenue, and restaurant settings.
- [Customer](./customer-guide.md): discovery, cart, checkout, tracking, and help.
- [Driver](./driver-guide.md): onboarding, Online/GPS, dispatch, earnings, and profile.

Customer and Driver have no browser URL. Launch their explicit Flutter entrypoints on a device/emulator; do not substitute Admin or Restaurant media for mobile UI.

## Motion previews

| Flow | Preview |
|---|---|
| Admin sign-in → overview | ![Admin sign-in to overview](./media/gifs/admin-login-flow.gif) |
| Restaurant order queue → menu | ![Restaurant orders to menu](./media/gifs/restaurant-orders-to-menu.gif) |
| Customer sign-in → registration → sign-in | ![Customer public authentication flow](./media/gifs/customer-auth-flow.gif) |
| Driver sign-in → Home → earnings → profile | ![Driver role flow](./media/gifs/driver-role-flow.gif) |

## Historical controlled-production web smoke

These two Google Chrome captures belong to deployed revision `17584153ff256b74a3413ae9844f4f27bff038cc`, not current runtime `977d55f19ddc4fecafb8a758d2df034f4b6ff21d`. Railway API/worker/migrator and Vercel Admin/Restaurant health now report that current SHA, but the four-role Chrome, GPS, and device certification has not been rerun for it. At capture time the Admin overview showed the four synthetic role-smoke users and one temporary restaurant; the Restaurant queue was scoped to that temporary restaurant and had no orders. Cleanup then removed every fixture user, profile, restaurant, order, and GPS row. The images prove only the bounded historical authentication journey described in the manifest.

| Admin authenticated overview | Restaurant authenticated order queue |
|---|---|
| ![Historical controlled-production Admin overview](./screenshots/production/2026-07-15-admin-authenticated-overview.png) | ![Historical controlled-production Restaurant order queue](./screenshots/production/2026-07-15-restaurant-authenticated-orders.png) |

GIFs are silent, optimized previews. Admin/Restaurant use reviewed Google Chrome frames. Customer records only public sign-in → registration → sign-in navigation without entered credentials. Driver uses four privacy-reviewed Android AVD role stills. None of these previews certifies a production or mobile release journey.

## Admin

See the [Admin guide](./admin-guide.md) for sign-in, navigation, role boundaries, and troubleshooting.

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

See the [Restaurant guide](./restaurant-guide.md) for orders, menu, staff permissions, settings, and troubleshooting.

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

Customer is a first-class Flutter/Riverpod native Android/iOS product. Start it from [`main_customer.dart`](../mobile/lib/main_customer.dart) with the Android `customer` flavor. Its documented scope includes discovery, ordering, cart, checkout, tracking, and support; see the [Customer guide](./customer-guide.md) for the user journey and the [mobile guide](../mobile/README.md) for runtime and build details.

For the cross-role Customer/Driver workflow, permission behaviour, and explicit run commands, see the [Customer and Driver mobile guide](./customer-driver-guide.md).

The following privacy-reviewed Android AVD media contains one app-launch still and one public-auth GIF showing sign-in → registration → sign-in without entered credentials. Authenticated Home/discovery stills that exposed exact simulated coordinates are intentionally not retained. The manifest records dirty-workspace provenance, so this media is regression evidence only and cannot become visual release evidence without a clean-head recapture.

### Customer public authentication and app launch

![Customer sign-in, registration, and return flow](./media/gifs/customer-auth-flow.gif)

![Customer app launch on Android emulator](./screenshots/customer/01-login.webp)

Authenticated Customer stills that showed exact simulated coordinates were excluded from this gallery. The coordinate-redaction behavior is covered by mobile regression tests instead of altered screenshots.

## Driver

Driver is a first-class Flutter/Riverpod native Android/iOS product. Start it from [`main_driver.dart`](../mobile/lib/main_driver.dart) with the Android `driver` flavor. Read the [Driver guide](./driver-guide.md) for sign-in, onboarding, truthful Online state, dispatch, earnings, and profile; see the [mobile guide](../mobile/README.md) for runtime and build details.

![Driver sign-in, Home, earnings, and profile flow](./media/gifs/driver-role-flow.gif)

### Driver sign-in

![Driver sign-in on Android emulator](./screenshots/driver/01-login.webp)

### Driver Home

![Driver active-delivery Home with explicit GPS-resume status](./screenshots/driver/02-home.webp)

### Driver earnings

![Driver earnings](./screenshots/driver/03-earnings.webp)

### Driver profile

![Driver profile](./screenshots/driver/04-profile.webp)

### GPS and foreground-tracking evidence

These test-only Android API 35 emulator images use only a simulated route and deterministic test data. They demonstrate the Driver's explicit Online action, Android notification-permission flow, and the location foreground notification. No real location, production account, password, credential, token, or unrelated personal notification is visible.

The associated local E2E check accepted the authenticated GPS command, refreshed Redis liveness, persisted the sample to PostGIS, and delivered one authorized Admin Socket.IO event. This is local Socket.IO compatibility evidence only, **not** Supabase, Railway, Vercel, or production evidence.

A separate 2026-07-15 Android API 35 production-emulator smoke used a temporary synthetic Driver against Railway and Supabase. It verified explicit Online foreground tracking, screen-off updates, bounded airplane-mode buffering with original timestamps, refresh/restart after process termination, PostGIS persistence, and an authorized private Broadcast received by a temporary Admin subscriber. The test account and GPS rows were deleted afterward. This is production backend/provider and emulator evidence, not physical-device, iOS, FCM, payout, or app-store certification.

### Driver Online after GPS verification

![Driver Online after verified GPS update](./screenshots/driver/driver-online-gps-e2e.webp)

### Current Driver Online device smoke

![Driver Online while foreground GPS tracking is active](./screenshots/driver/driver-online-realtime-gps.webp)

### Android API 35 production recovery smoke

![Driver Online after Android process and foreground-tracking recovery](./screenshots/driver/driver-online-android-api35-recovery.webp)

### Android foreground-tracking notification permission

![Android notification permission prompt for Driver tracking](./screenshots/gps/driver-notification-permission.webp)

### Android foreground location notification

![Privacy-reviewed Driver foreground location notification](./screenshots/gps/driver-foreground-location-notification.webp)

## Capture procedure

1. Build the base + `docker-compose.e2e.yml` stack from the target source head.
2. Apply all migrations and run the deterministic non-production seed.
3. Require API/Admin/Restaurant health 200.
4. Use the overlay's configured `localhost` origins; `127.0.0.1` is intentionally a CORS error-state origin.
5. Authenticate through the real API, inject only short-lived local session state, and visit each web route with the Playwright Google Chrome channel.
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

The script prints origins and file names, never access/refresh tokens or provider secrets. The current manifest records source/runtime boundaries, Google Chrome for web, Android API 35 x86_64 AVD for mobile, deterministic seed identities, masked passwords, fixed simulated GPS, and no Google Maps API key for the mobile role capture. A release-use recapture still requires a clean final head and immutable runtime references.

## Historical QA record and recapture boundary

- The 2026-07-10 capture through `127.0.0.1` correctly showed CORS failures and was discarded. The retained historical capture used `localhost` with seeded API data.
- The recorded Admin overview KPI locale and contrast issue was fixed before the historical vi/en/ja Chromium/Firefox review. That record must not be read as a current browser-E2E or final-head result.
- Existing media stays historical until it is recaptured from the committed release candidate and its source/runtime references are recorded. A capture from a dirty workspace is runtime evidence only, never release proof.
- Admin/Restaurant web maps accept the keyless MapLibre/OpenFreeMap basemap. Mobile map widgets are a separate integration and are not relabelled as OpenFreeMap. A blank/error map or missing backend GPS/route must not be edited into a successful screenshot.
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
