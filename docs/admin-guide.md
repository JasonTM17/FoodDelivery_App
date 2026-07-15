# Admin Guide

Languages: **English** | [Tiếng Việt](./admin-guide.vi.md) | [日本語](./admin-guide.ja.md)

FoodFlow Admin is the locale-aware Next.js operations dashboard. This guide reflects the current routes and local visual evidence; it does not certify a deployed production journey.

## Prerequisites

- Start the API and Admin app, then open `http://localhost:3000/{locale}/login` with `locale` set to `vi`, `en`, or `ja`.
- Use an authorized Admin account. The capture manifest records non-secret seed identities only; passwords are deliberately excluded from documentation and media.
- Keep the browser pointed at `localhost` for the isolated E2E stack described in the [gallery](./product-gallery.md#capture-procedure).

## Sign in and navigate

1. Enter the Admin email and password, then submit once.
2. A successful sign-in opens **Overview**. Authentication or authorization errors remain on a safe error state; do not treat a loading or empty screen as success.
3. Use the sidebar. Links preserve the active `vi`, `en`, or `ja` locale.
4. Sign out from the bottom of the sidebar when the review is complete.

![Admin sign-in to overview](./media/gifs/admin-login-flow.gif)

## Main workflows

| Area | Current workflow |
|---|---|
| Overview | Review operational KPIs and charts before opening the underlying lists. |
| Orders | Filter orders, open an order, and inspect its current server-backed state. |
| Restaurants | Review restaurant records, details, and approval actions. |
| Users and Drivers | Inspect account/driver records; use the Driver map only with authorized, valid location data. |
| Promotions | Review, create, edit, and inspect promotions; server validation remains authoritative. |
| Support | Work the support queue and ticket detail without treating a failed load as an empty queue. |
| Analytics and Reports | Review aggregates and reports; use Export Jobs for asynchronous export status. |
| AI Monitor | Inspect AI usage telemetry; missing provider configuration must remain an explicit degraded state. |
| Settings | Manage general, branding, compliance, and integration settings within Admin authorization. |

The Admin web map accepts the keyless OpenFreeMap style through MapLibre. It does not require a Google Maps browser API key. Backend directions are separate and fail closed when neither configured Google Directions nor an owned OSRM service is available.

## Visual reference

| Overview | Orders |
|---|---|
| ![Admin overview](./screenshots/admin/02-overview.png) | ![Admin orders](./screenshots/admin/03-orders.png) |

| Drivers | Settings |
|---|---|
| ![Admin drivers](./screenshots/admin/06-drivers.png) | ![Admin settings](./screenshots/admin/10-settings.png) |

All ten Admin stills are in the [product gallery](./product-gallery.md#admin).

## Troubleshooting

| Symptom | Action |
|---|---|
| Returned to sign-in | Confirm the local API is healthy and the account has the Admin role; sign in again rather than injecting a session. |
| Wrong language or route | Open the matching `/vi/...`, `/en/...`, or `/ja/...` URL and use locale-preserving navigation. |
| Empty list after an error | Retry and inspect the visible error. Do not record a failed request as a valid empty state. |
| Map unavailable | Verify the OpenFreeMap style configuration and backend telemetry. Never invent coordinates, routes, or ETA. |
| Export/AI integration unavailable | Review the explicit job/provider state; do not add placeholder secrets or claim success. |

## Evidence boundary

The Admin PNGs and GIF were captured in Google Chrome from the isolated local Docker E2E stack with deterministic seed data. The manifest records a dirty working tree and local runtime images. They are privacy-reviewed product/regression evidence, not production or release certification. See [capture provenance](./screenshots/README.md) and the [full gallery](./product-gallery.md).
