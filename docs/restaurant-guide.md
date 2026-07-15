# Restaurant Guide

Languages: **English** | [Tiếng Việt](./restaurant-guide.vi.md) | [日本語](./restaurant-guide.ja.md)

FoodFlow Restaurant is the locale-aware Next.js workspace for restaurant owners and authorized staff. This guide follows the current routes and permission model; it is not production certification.

## Prerequisites

- Start the API and Restaurant app, then open `http://localhost:3002/{locale}/login` with `locale` set to `vi`, `en`, or `ja`.
- Use an account with an active restaurant membership. Staff see only areas allowed by their membership permissions.
- The capture manifest stores non-secret seed identities, never passwords. Do not copy credentials into docs, screenshots, tickets, or chat.

## Sign in and handle orders

1. Enter the Restaurant account email and password and submit once.
2. A successful sign-in opens **Orders**. If the membership is missing or lacks access, resolve that authorization issue instead of bypassing the route guard.
3. Review the order queue, open the selected order, and make only transitions that the UI and API allow.
4. Move to **Menu** to manage categories, items, and item options. Recheck availability and price before publishing changes.
5. Sign out when the operating session ends.

![Restaurant orders to menu](./media/gifs/restaurant-orders-to-menu.gif)

## Main workflows

| Area | Current workflow |
|---|---|
| Overview | Review the restaurant dashboard summary. |
| Orders | Monitor the queue and open order details; API state is authoritative. |
| Menu | Manage categories and create/edit menu items and options. |
| Promotions | Create, inspect, and edit eligible restaurant promotions. |
| Analytics and Insights | Review performance aggregates and generated insights without substituting fake fallback data. |
| Staff | Invite staff, assign supported permissions, and manage shifts. Kitchen or manager access can be narrower than owner access. |
| Revenue | Review totals and transaction/history views returned for the restaurant tenant. |
| Reviews | Read restaurant reviews and related summaries. |
| Notifications | Review the authenticated restaurant inbox. |
| Settings | Update general/profile details and opening hours within granted permissions. |

Restaurant data is tenant-scoped. A staff member must not use copied URLs to reach another restaurant or a section outside their membership. The Restaurant web tracking map accepts the keyless OpenFreeMap style through MapLibre and needs no Google Maps browser API key; backend directions remain a separately configured, fail-closed integration.

## Visual reference

| Dashboard | Order queue |
|---|---|
| ![Restaurant dashboard](./screenshots/restaurant/02-dashboard.png) | ![Restaurant orders](./screenshots/restaurant/03-orders.png) |

| Menu | Revenue |
|---|---|
| ![Restaurant menu](./screenshots/restaurant/04-menu.png) | ![Restaurant revenue](./screenshots/restaurant/06-revenue.png) |

| Staff | Settings |
|---|---|
| ![Restaurant staff](./screenshots/restaurant/08-staff.png) | ![Restaurant settings](./screenshots/restaurant/10-settings.png) |

All ten Restaurant stills are in the [product gallery](./product-gallery.md#restaurant).

## Troubleshooting

| Symptom | Action |
|---|---|
| Returned to sign-in | Verify API health and the active restaurant membership, then sign in again. |
| Forbidden section | Ask the owner to review the staff permission; do not bypass the guard with a direct URL. |
| Queue or menu appears empty after an error | Retry and inspect the visible failure. Do not treat a failed request as real zero data. |
| Order update rejected | Reload the order and follow its latest server state; do not repeat a stale transition. |
| Map or route unavailable | Verify OpenFreeMap style and backend route/telemetry configuration; do not invent a route or ETA. |

## Evidence boundary

The Restaurant PNGs and GIF were captured in Google Chrome from the isolated local Docker E2E stack with deterministic seed data. The manifest records a dirty working tree and local images. This is privacy-reviewed product/regression evidence, not proof of a production tenant, release artifact, or live provider. See [capture provenance](./screenshots/README.md) and the [full gallery](./product-gallery.md).
