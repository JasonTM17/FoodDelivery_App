# FoodFlow Screenshot Inventory

Privacy-reviewed product media for the four FoodFlow roles. Read the [capture manifest](./manifest.json) for timestamps, source heads, runtime context, seed identities, and dirty-working-tree boundaries.

## Capture environments

| Scope | Environment | Boundary |
|---|---|---|
| Admin / Restaurant controlled production smoke | Google Chrome against the canonical Vercel aliases, Railway API, and Supabase production | Historical authenticated role evidence for runtime SHA `17584153`; capture-time aggregates show four synthetic users and one temporary restaurant, then final cleanup returned production inventory to zero. Current Railway runtime is `84eeac3a2845868fc3a7fd45f8a73775e834a09d`; a separate current-revision API/realtime GPS smoke passed, but these captures are not current-revision four-role UI, active-order, payment, provider, or device certification. |
| Admin / Restaurant | Google Chrome against the isolated `foodflow-batch4-e2e` Docker stack with deterministic seed data | Local web product/regression evidence; not a deployed browser journey or release certification. |
| Customer / Driver role flows | Flutter debug APKs on an Android API 35 x86_64 AVD connected to local FoodFlow stacks | Public-auth plus authenticated synthetic-fixture Customer/Driver evidence from dirty working trees; not mobile release or production-provider certification. |
| Driver GPS / foreground tracking | Android API 35 emulator with fixed simulated location and local Socket.IO compatibility | Local command/persistence/fanout evidence only; not Supabase/Railway, payout, routing, or production proof. |
| Driver production GPS recovery | Android API 35 x86_64 emulator using Railway and Supabase with a temporary synthetic Driver | Authenticated production-emulator evidence for foreground tracking, screen-off updates, offline flush, process recovery, PostGIS and private Broadcast; not physical-device, iOS, FCM, payout or app-store certification. |

The manifest records only deterministic synthetic seed identities. Passwords stay masked and are not stored in docs or media. No token, provider key, production account, real coordinate, or personal notification is approved for capture. Authenticated Customer captures show only generic/synthetic fixture content and no exact coordinate. Mobile role capture used no Google Maps API key. Admin/Restaurant web map configuration accepts only the keyless OpenFreeMap style through MapLibre; mobile map widgets are a separate integration and are not relabelled as OpenFreeMap. `assetIntegrity.files` records SHA-256 for all 46 curated media paths, resolved relative to this directory.

## Role guides

| Role | English | Tiếng Việt | 日本語 |
|---|---|---|---|
| Admin | [Guide](../admin-guide.md) | [Hướng dẫn](../admin-guide.vi.md) | [ガイド](../admin-guide.ja.md) |
| Restaurant | [Guide](../restaurant-guide.md) | [Hướng dẫn](../restaurant-guide.vi.md) | [ガイド](../restaurant-guide.ja.md) |
| Customer | [Guide](../customer-guide.md) | [Hướng dẫn](../customer-guide.vi.md) | [ガイド](../customer-guide.ja.md) |
| Driver | [Guide](../driver-guide.md) | [Hướng dẫn](../driver-guide.vi.md) | [ガイド](../driver-guide.ja.md) |

## Inventory

| Surface | Stored assets | Contents |
|---|---:|---|
| Admin | 10 PNG stills + 1 GIF | Sign-in, overview, orders, restaurants, users, drivers, promotions, support, analytics, settings; login-to-overview flow. |
| Restaurant | 10 PNG stills + 1 GIF | Sign-in, dashboard, orders, menu, promotions, revenue, reviews, staff, insights, settings; orders-to-menu flow. |
| Customer | 9 WebP stills + 2 GIFs | App launch/public auth, authenticated Home/Orders/Profile, nearby restaurants, menu, cart, checkout, truthful tracking state, and role-flow evidence. |
| Driver | 8 WebP stills + 1 GIF | Sign-in, Home, earnings, profile, dispatch offer, three Online/GPS states; sign-in-to-profile role flow. |
| Android GPS | 2 WebP stills | Notification permission and foreground location notification while Driver is Online. |
| Controlled production web smoke | 2 PNG stills | Authenticated Admin overview and tenant-scoped Restaurant empty order queue; synthetic identities deleted after capture. |

### Admin

`admin/01-login.png` through `admin/10-settings.png`; GIF: `../media/gifs/admin-login-flow.gif`.

### Restaurant

`restaurant/01-login.png` through `restaurant/10-settings.png`; GIF: `../media/gifs/restaurant-orders-to-menu.gif`.

### Controlled production web smoke

- `production/2026-07-15-admin-authenticated-overview.png` — canonical Admin overview after a temporary Admin authenticated in Google Chrome.
- `production/2026-07-15-restaurant-authenticated-orders.png` — canonical Restaurant queue scoped to the temporary smoke restaurant.

These two images are bounded authenticated role evidence, not general production data. The corresponding Customer and Driver check used read-only API contracts because those products are native Flutter apps; it is not presented as mobile UI or device evidence.

### Customer

- `customer/01-login.webp` — privacy-reviewed Customer app launch from the verified Android build.
- `customer/02-home.webp` — authenticated Home with generic current location, promotion, and nearby synthetic restaurant data.
- `customer/03-orders.webp` — active synthetic order with post-fix localized `Chờ nhà hàng` status.
- `customer/04-profile.webp` — generic profile label and synthetic aggregate/menu data without contact details.
- `customer/02-home-nearby-restaurants.webp` — nearby restaurant discovery with fixed simulated GPS.
- `customer/03-restaurant-menu.webp` — restaurant menu and item selection.
- `customer/04-cart.webp` — cart totals and checkout action.
- `customer/05-checkout.webp` — delivery address, payment method, and order summary.
- `customer/06-order-tracking-degraded.webp` — truthful tracking state before a Driver is assigned.
- `../media/gifs/customer-auth-flow.gif` — real Customer sign-in → registration → sign-in navigation recorded without entering credentials.
- `../media/gifs/customer-role-flow.gif` — three-frame authenticated Home → Orders → Profile preview generated from the reviewed Customer stills.

### Driver

- `driver/01-login.webp` — Driver sign-in.
- `driver/02-home.webp` — active-delivery Home with explicit GPS-resume status.
- `driver/03-earnings.webp` — earnings summary/history.
- `driver/04-profile.webp` — profile, vehicle summary, language, and sign-out.
- `driver/05-dispatch-offer.webp` — realtime dispatch offer received while Driver is Online.
- `driver/driver-online-gps-e2e.webp` — Online after the verified local GPS chain.
- `driver/driver-online-realtime-gps.webp` — Online while foreground tracking is active.
- `driver/driver-online-android-api35-recovery.webp` — privacy-reviewed production-emulator Online state used for foreground, network-loss, and process-recovery verification.
- `../media/gifs/driver-role-flow.gif` — four-frame sign-in, Home, earnings, and profile preview generated only from the privacy-reviewed Driver stills.
- `gps/driver-notification-permission.webp` — Android notification permission for tracking.
- `gps/driver-foreground-location-notification.webp` — foreground location notification.

## Review and recapture

Use the [product gallery](../product-gallery.md) for rendered media and the capture procedure. Before retaining any recapture, verify locale, visible error/loading states, API-backed data, crop/clipping, and privacy. A release-use recapture must bind media to a clean final source head and immutable runtime references. Successful local automation or a privacy review does not convert dirty-working-tree media into production certification.
