# FoodFlow Screenshot Inventory

Historical non-production product stills for the root README and [product gallery](../product-gallery.md). The manifest records `capturedAt` 2026-07-10 but no source SHA, Compose reference, or image reference, so these assets do not prove the current source head or a release candidate. Admin and Restaurant images came from an isolated Docker/E2E stack with deterministic test data; Driver GPS images came from an Android API 35 emulator connected to that non-production stack.

| Surface | Stored assets | Inventory status |
|---|---:|---|
| Admin | 10 PNG stills | Historical non-production web media. |
| Restaurant | 10 PNG stills | Historical non-production web media. |
| Customer | 0 | No Customer still is stored. The Customer app is documented from source, not represented by gallery media. |
| Driver | 2 WebP stills | Test-only Android API 35 simulated-GPS/permission assets; not mobile-release, Supabase, Railway, or production evidence. |

| File | Surface | Route/content |
|---|---|---|
| `admin/01-login.png` | Admin | `/vi/login` |
| `admin/02-overview.png` | Admin | Overview KPIs/charts |
| `admin/03-orders.png` | Admin | Orders |
| `admin/04-restaurants.png` | Admin | Restaurants |
| `admin/05-users.png` | Admin | Users |
| `admin/06-drivers.png` | Admin | Drivers |
| `admin/07-promotions.png` | Admin | Promotions |
| `admin/08-support.png` | Admin | Support |
| `admin/09-analytics.png` | Admin | Analytics |
| `admin/10-settings.png` | Admin | Settings |
| `restaurant/01-login.png` | Restaurant | `/vi/login` |
| `restaurant/02-dashboard.png` | Restaurant | Dashboard |
| `restaurant/03-orders.png` | Restaurant | Order queue |
| `restaurant/04-menu.png` | Restaurant | Menu |
| `restaurant/05-promotions.png` | Restaurant | Promotions |
| `restaurant/06-revenue.png` | Restaurant | Revenue |
| `restaurant/07-reviews.png` | Restaurant | Reviews |
| `restaurant/08-staff.png` | Restaurant | Staff |
| `restaurant/09-insights.png` | Restaurant | Insights |
| `restaurant/10-settings.png` | Restaurant | Settings |
| `driver/driver-online-gps-e2e.webp` | Driver | Online state after a verified emulator GPS update |
| `gps/driver-notification-permission.webp` | Android | Runtime notification permission prompted when the driver enables tracking |

`manifest.json` stores capture UTC, local base URLs, non-secret seed identities, and bounded local GPS evidence. A release-use recapture must additionally record the source commit, Compose/image references, and whether it used a clean final head or dirty workspace. It must never contain real coordinates, passwords, access/refresh tokens, API keys, or provider secrets.

Regenerate with `node docs/scripts/capture-product-media.mjs` using the environment shown in the product gallery. Inspect every image after capture; successful automation can still record a CORS, API, or localization defect.
