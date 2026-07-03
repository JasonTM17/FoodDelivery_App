# OpenAPI Changelog

- 2026-07-03: Added grounded chatbot reply metadata (`language`, `grounded`, `toolCalls`) and documented that AI tools are internal customer-scoped service methods, not public `/ai/tools/*` routes.
- 2026-07-03: Removed the legacy workflow-engine provider, automation webhooks, and synthetic run-detail contract. `/admin/ai-monitor` now reports DeepSeek configuration plus nullable real telemetry only.
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
- Security: `bearerAuth` (JWT Ed25519); the initial service API-key scheme was removed with the legacy automation webhooks
- Idempotency: `Idempotency-Key` header (UUID v4)
- Inbound HMAC: SePay `x-sepay-signature`
- Outbound HMAC: `X-Signature-SHA256` for configured generic webhooks

### Vietnamese Sample Data

All examples use Vietnamese data (restaurant names like "Phở 24", customer names like "Nguyễn Văn A", addresses in HCMC districts).
