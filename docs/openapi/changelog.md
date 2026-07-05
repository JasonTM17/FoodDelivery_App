# OpenAPI Changelog

- 2026-07-05: Restricted public `POST /auth/register` to customer-only signup, removed the `role` request field, and clarified that driver, restaurant, and admin accounts require controlled onboarding or invitation flows.
- 2026-07-05: Aligned `GET /admin/restaurants/{restaurantId}/reviews` with the existing `restaurants` tag so Spectral OpenAPI lint is clean at warning severity.
- 2026-07-05: Added required `routePhase` to `GET /orders/{id}/tracking` so customer/mobile clients can distinguish pickup and dropoff route geometry from the initial REST snapshot before realtime ETA events arrive.
- 2026-07-04: Covered all literal Admin/Restaurant web API calls in `docs/openapi.yaml` (`MISSING_ENDPOINTS=0` in the local coverage scanner), including Admin KPI/recent-order feeds, dispatch heatmap coordinates, resource detail panels, support replies/agents, driver KYC review, and admin promotion analytics. Shared web API-client types now mirror these backend contracts.
- 2026-07-04: Aligned customer promotion endpoints with backend/mobile: added `/promotions/available` and `/promotions/my`, changed `/promotions/validate` to accept `subtotal`, and documented validation as a preview-only response before atomic order-time claim.
- 2026-07-04: Aligned `/users/wallet` with the confirmed wallet ledger (`amountDelta`, `credit|debit`, `reason`, optional `refId`) and removed the unimplemented `/users/wallet/topup` contract; mobile no longer exposes fake top-up/withdraw actions.
- 2026-07-04: Added `/admin/charts` response contract for database-backed customer retention cohorts; Admin Analytics no longer displays a degraded retention placeholder.
- 2026-07-04: Admin export jobs now complete CSV and XLSX inline from real database rows; `/admin/exports/{id}/download` advertises both CSV and XLSX content types while Parquet remains explicitly unavailable until a real file writer exists.
- 2026-07-04: `/admin/ai-monitor` now reports DB-backed AI conversation counts, escalations, and resolution rate; chatbot support tickets are attributed with `ai_session:<uuid>` tags and usage-cost/token latency fields remain nullable until real telemetry is connected.
- 2026-07-03: Added `GET/PATCH /restaurant/profile` contract with tenant-scoped `openingHours` and persisted `holidayClosures` replace-list semantics.
- 2026-07-03: Aligned driver dispatch/mobile contract: added `GET /driver/orders/active`, `GET /driver/orders/history`, payout-ledger `DriverEarnings.entries`, and documented `/dispatch` WebSocket accept/reject with `offerToken` instead of legacy REST accept endpoints.
- 2026-07-03: Isolated persisted restaurant-driver chat events from customer order rooms and added `orderId` to the realtime event payload.
- 2026-07-03: Added customer-scoped `GET /orders/{orderId}/tracking`; its nullable GPS, ETA, and route fields are backed by Redis/cache/database telemetry without synthetic coordinates.
- 2026-07-03: Added `GET /restaurant/insights` with tenant-scoped insight schemas and i18n-keyed suggestion payloads (`titleKey`, `descriptionKey`, `predictedImpactKey`, `params`).
- 2026-07-03: Removed legacy `mock_wallet` from public order placement validation; clients must use `wallet`, which captures against the real wallet ledger.
- 2026-07-03: Clarified `/admin/online-drivers` as a nationwide Vietnam map feed backed by Redis geo presence and DB profile/order enrichment.
- 2026-07-03: Added grounded chatbot reply metadata (`language`, `grounded`, `toolCalls`) and documented that AI tools are internal customer-scoped service methods, not public `/ai/tools/*` routes.
- 2026-07-03: Removed the legacy automation provider, automation webhooks, and synthetic run-detail contract. `/admin/ai-monitor` now reports DeepSeek configuration plus nullable real telemetry only.
- 2026-07-02: Added the initial AI monitor degraded-state contract. Superseded by the DeepSeek-only contract on 2026-07-03.
- 2026-07-02: Added restaurant profile image upload contract and aligned menu category editing with backend `PATCH` routes.
- 2026-07-02: Added canonical admin export jobs, legacy report/export aliases, platform settings sections, and AI chatbot request/reply contracts. Export formats are normalized to `csv | xlsx | parquet`; statuses are `queued | running | completed | failed | cancelled`.
- 2026-07-02: Aligned admin audit list filters, canonical pagination envelope, bigint serialization, and filtered CSV download with implemented routes.

## v1.0.1 (2026-07-02)

- Added `GET /restaurant/promotions/targeting-preview`.
- Audience reach is derived from successful restaurant order history and remains tenant-scoped.
- Promotion broadcasts now resolve the same tenant-scoped audience and report targeted/sent counts.
- Admin promotion create/update now uses the canonical Prisma field names and preserves name, description, per-user limit, targeting, and status.
- Saved segments return an explicit problem detail until a persisted segment source is available.

## v1.0.0 (2026-06-09)

### Initial Release

Authored the canonical OpenAPI 3.1 contract covering all 12 backend modules:

| Module | Endpoints | Key Operations |
|--------|-----------|----------------|
| auth | 9 | register, login, refresh, logout, forgot/reset password, verify email, OTP request/verify, JWKS |
| users | 8 | get/update profile, upload avatar, CRUD addresses, wallet balance, wallet topup |
| restaurants | 5 | nearby (PostGIS), search, detail, menu, reviews |
| menu | 8 | get menu, CRUD categories, CRUD items, toggle availability |
| orders | 9 | place order, list/search orders, get detail, cancel, review, restaurant status, driver status |
| drivers | 8 | go online/offline, earnings, trip history, KYC submit/status, withdrawal request/history |
| payments | 4 | list payment intents, refund, SePay webhook, legacy order event webhook |
| promotions | 9 | validate code, get by code, admin CRUD + toggle, list promotions |
| notifications | 5 | list, mark read, mark all read, register/unregister FCM token |
| support | 8 | create ticket, get ticket, add reply, CSAT, admin list/update/bulk tickets |
| audit | 3 | list logs, full-text search, export |
| analytics | 7 | dashboard KPIs, top restaurants, revenue chart, heatmap, per-restaurant KPI, admin user/restaurant/order lists |

**Total: 75 endpoints, ~2,600 lines**

### Conventions Established

- All monetary fields: `integer` (VND)
- All datetimes: `string, format: date-time`
- All list responses: `{ data: [], meta: PaginationMeta }` envelope
- All errors: `ProblemDetail` schema (RFC 7807)
- Actor annotations: `x-foo-actor` on every operation
- Security: `bearerAuth` (JWT bearer token; signing algorithm follows the active JWT cutover phase); the initial service API-key scheme was removed with the legacy automation callbacks
- Idempotency: `Idempotency-Key` header (UUID v4)
- Inbound HMAC: SePay `x-sepay-signature`
- Outbound HMAC: `X-Signature-SHA256` for configured generic webhooks

### Vietnamese Sample Data

All examples use Vietnamese data (restaurant names like "Phở 24", customer names like "Nguyễn Văn A", addresses in HCMC districts).
