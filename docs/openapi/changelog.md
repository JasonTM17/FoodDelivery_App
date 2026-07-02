# OpenAPI Changelog

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
| payments | 4 | list payment intents, refund, SePay webhook, n8n order event webhook |
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
- Security: `bearerAuth` (JWT Ed25519) + `ApiKeyAuth` (service-to-service)
- Idempotency: `Idempotency-Key` header (UUID v4)
- Inbound HMAC: SePay `x-sepay-signature`
- Outbound HMAC: `X-Signature-SHA256` to n8n

### Vietnamese Sample Data

All examples use Vietnamese data (restaurant names like "Phở 24", customer names like "Nguyễn Văn A", addresses in HCMC districts).
