# FoodFlow Screenshot Inventory

Privacy-reviewed product media for the four FoodFlow roles. Read the [capture manifest](./manifest.json) for timestamps, source heads, runtime context, seed identities, and dirty-working-tree boundaries.

## Capture environments

| Scope | Environment | Boundary |
|---|---|---|
| Admin / Restaurant controlled production smoke | Google Chrome against the canonical Vercel aliases, Railway API, and Supabase production | Authenticated zero-state role evidence for runtime SHA `17584153`; synthetic fixture rows were removed. Not active-order, payment, provider, or device certification. |
| Admin / Restaurant | Google Chrome against the isolated `foodflow-batch4-e2e` Docker stack with deterministic seed data | Local web product/regression evidence; not a deployed browser journey or release certification. |
| Customer / Driver role flows | Flutter debug APKs on an Android API 35 x86_64 AVD connected to the isolated E2E stack | Built from the current dirty working tree; not a mobile release or production-provider certification. |
| Driver GPS / foreground tracking | Android API 35 emulator with fixed simulated location and local Socket.IO compatibility | Local command/persistence/fanout evidence only; not Supabase/Railway, payout, routing, or production proof. |

The manifest records only deterministic seed identities. Passwords stay masked and are not stored in docs or media. No token, provider key, production account, real coordinate, or personal notification is approved for capture. The mobile role capture used no Google Maps API key. Admin/Restaurant web map configuration accepts only the keyless OpenFreeMap style through MapLibre; mobile map widgets are a separate integration and are not relabelled as OpenFreeMap.

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
| Customer | 1 WebP still + 1 GIF | Privacy-reviewed app launch and public sign-in/registration navigation without entered credentials. |
| Driver | 6 WebP stills + 1 GIF | Sign-in, Home, earnings, profile, two Online/GPS states; sign-in-to-profile role flow. |
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
- `../media/gifs/customer-auth-flow.gif` — real Customer sign-in → registration → sign-in navigation recorded without entering credentials.

### Driver

- `driver/01-login.webp` — Driver sign-in.
- `driver/02-home.webp` — active-delivery Home with explicit GPS-resume status.
- `driver/03-earnings.webp` — earnings summary/history.
- `driver/04-profile.webp` — profile, vehicle summary, language, and sign-out.
- `driver/driver-online-gps-e2e.webp` — Online after the verified local GPS chain.
- `driver/driver-online-realtime-gps.webp` — Online while foreground tracking is active.
- `../media/gifs/driver-role-flow.gif` — four-frame sign-in, Home, earnings, and profile preview generated only from the privacy-reviewed Driver stills.
- `gps/driver-notification-permission.webp` — Android notification permission for tracking.
- `gps/driver-foreground-location-notification.webp` — foreground location notification.

## Review and recapture

Use the [product gallery](../product-gallery.md) for rendered media and the capture procedure. Before retaining any recapture, verify locale, visible error/loading states, API-backed data, crop/clipping, and privacy. A release-use recapture must bind media to a clean final source head and immutable runtime references. Successful local automation or a privacy review does not convert dirty-working-tree media into production certification.
