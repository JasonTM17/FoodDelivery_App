# API Contract

## Versioning Policy

Path-based versioning: `/v1/`, `/v2/`, etc. Breaking changes increment the version path signal. Non-breaking changes (new optional fields, new endpoints, new enum values) are additive within the same version.

### What constitutes a breaking change?

- Removing or renaming a field (request or response)
- Changing a field type (e.g., string → integer)
- Making an optional field required
- Removing an endpoint
- Changing an enum value
- Changing authentication requirements
- Narrowing a pattern constraint
- Changing pagination semantics

### What is NOT a breaking change?

- Adding a new endpoint
- Adding an optional request field
- Adding an optional response field
- Adding a new enum value
- Relaxing a pattern constraint
- Changing error message text (not code)

## HMAC Conventions

### Inbound HMAC (SePay Webhook)

| Field | Value |
|-------|-------|
| Header | `x-sepay-signature` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body (`JSON.stringify(body)`) |
| Secret | `SEPAY_WEBHOOK_SECRET` env var |
| Verification | Timing-safe compare via `crypto.timingSafeEqual` |
| Replay protection | Redis dedup key per `transaction_ref`, TTL 24h |

**Verification flow:**
1. Read `x-sepay-signature` header
2. HMAC-SHA256 the raw body against the shared secret
3. Compare: `crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expected))`
4. If mismatch → 400 `{"code": "WEBHOOK_INVALID_SIGNATURE"}`
5. Check dedup key in Redis → if exists return 200 with `{received: true, duplicate: true}`
6. Process payment, set dedup key with 24h TTL

### Outbound HMAC (n8n / Third-Party)

| Field | Value |
|-------|-------|
| Header | `X-Signature-SHA256` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body |
| Secret | `WEBHOOK_SECRET` env var (per-target) |

Every outbound call from app → n8n (or any third-party workflow tool) must include an HMAC signature. The receiver verifies with timing-safe compare before processing.

### API Key Auth (n8n → App)

| Header | `x-api-key` |
| Secret | `N8N_API_KEY` env var |

Used by n8n webhook endpoints (e.g., `POST /webhooks/n8n/order-event`). Guarded by `ApiKeyGuard` on the backend.

## Success Envelope

All successful web/admin/restaurant responses use a stable envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`meta` is optional for single-resource responses. Collection endpoints put the array in `data` and pagination or aggregation context in `meta`:

```json
{
  "success": true,
  "data": [],
  "meta": { "total": 0, "page": 1, "limit": 20, "hasMore": false }
}
```

The customer/mobile contract is not changed by Batch 4 compatibility work unless a versioned endpoint explicitly opts in.

## Problem Detail Error Format

All error responses follow RFC 7807 Problem Details and are not wrapped in the success envelope:

```json
{
  "type": "https://api.foodflow.vn/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "Email khong dung dinh dang",
  "instance": "/v1/auth/register",
  "code": "VALIDATION_INVALID_EMAIL"
}
```

Error codes are stable and documented in the OpenAPI spec. Clients should branch on `code`, not `message` text.

Common error codes:
- `AUTH_INVALID_CREDENTIALS` — wrong email/password
- `AUTH_ACCOUNT_LOCKED` — too many failed attempts
- `VALIDATION_INVALID_EMAIL` — malformed email
- `ORDER_CANNOT_CANCEL` — order is too far along the flow
- `PAYMENT_INSUFFICIENT_BALANCE` — wallet balance too low
- `PROMOTION_EXPIRED` — code passed its expiry
- `PROMOTION_LIMIT_REACHED` — usage cap hit
- `DUPLICATE_REQUEST` — idempotency key reused
- `NOT_FOUND` — resource not found
- `FORBIDDEN` — insufficient role

## Idempotency

For `POST /orders`, `POST /users/wallet/topup`, and `POST /driver/withdrawals`:

- Client sends `Idempotency-Key: <UUID v4>` header
- Server caches response for 24h (Redis key: `idem:<key>`)
- Replayed request returns cached response with `409` status
- If the original request is still in-flight, subsequent requests with the same key receive `409`

## Conventions Applied

| Convention | Rule |
|------------|------|
| Monetary values | `type: integer`, description: "VND" |
| Datetimes | `type: string, format: date-time` |
| Successful responses | `{ success: true, data, meta? }` |
| List endpoints | `{ success: true, data: [], meta: { total, page, limit, hasMore } }` |
| Actor extension | `x-foo-actor` on every operation: `public`, `user`, `driver`, `restaurant_owner`, `admin`, `service` |
| Security | `bearerAuth` for user/role endpoints; `ApiKeyAuth` for service-to-service |

## OpenAPI Changelog

See [docs/openapi/changelog.md](./openapi/changelog.md).

## CI Gate

The `openapi/validate` GitHub Actions workflow runs on every PR that touches the spec or backend controllers. It:
1. Runs Spectral lint (`pnpm openapi:lint`)
2. Verifies the spec is valid YAML
3. Required check on `main` branch
