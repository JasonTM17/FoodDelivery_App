# API Contract

Languages: [English](./api-contract.md) | [Tiếng Việt](./api-contract.vi.md) | [日本語](./api-contract.ja.md)

This document defines the web/admin/restaurant API contract used by Batch 4. It does not change legacy customer or mobile contracts unless an endpoint is explicitly versioned or aliased.

## Versioning policy

- Public versioned paths use `/v1`, `/v2`, and later version prefixes.
- Batch 4 web endpoints may also expose compatibility aliases for one cycle when an older Admin or Restaurant route already exists.
- Breaking changes require a new version or a documented compatibility alias.
- Additive changes can stay in the same version.

Breaking changes include:

- Removing or renaming a request or response field.
- Changing a field type.
- Making an optional field required.
- Removing an endpoint or enum value.
- Changing authentication or authorization requirements.
- Changing pagination semantics.

Non-breaking changes include:

- Adding a new endpoint.
- Adding optional request or response fields.
- Adding enum values.
- Relaxing validation constraints.
- Changing human-readable error text while keeping the same `code`.

## Success envelope

Successful web/admin/restaurant responses use one shape:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`meta` is optional for single-resource responses. Collection endpoints put the collection in `data` and pagination or aggregate context in `meta`.

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

## Error format

Errors use RFC 7807 Problem Details. They are not wrapped in the success envelope.

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

Clients must branch on `code`, not translated text.

Common codes:

| Code | Meaning |
|---|---|
| `AUTH_INVALID_CREDENTIALS` | Email/password is wrong. |
| `AUTH_ACCOUNT_LOCKED` | Account is temporarily locked. |
| `VALIDATION_INVALID_EMAIL` | Email format is invalid. |
| `ORDER_CANNOT_CANCEL` | Order is too far through the flow to cancel. |
| `PAYMENT_INSUFFICIENT_BALANCE` | Wallet balance is too low. |
| `PROMOTION_EXPIRED` | Promotion is past its expiry. |
| `PROMOTION_LIMIT_REACHED` | Promotion usage cap is reached. |
| `DUPLICATE_REQUEST` | Idempotency key was reused. |
| `NOT_FOUND` | Resource does not exist or is not visible to the actor. |
| `FORBIDDEN` | Actor lacks the required permission. |

## Pagination

Collection endpoints use:

- `data`: array of resources.
- `meta.total`: total matching resources when available.
- `meta.page`: one-based page index.
- `meta.limit`: requested page size.
- `meta.hasMore`: true when the server can provide another page.

Cursor-based endpoints may add cursor fields under `meta`, but the collection still remains in `data`.

## Authentication and refresh

- Web dashboards use bearer access tokens in Batch 4.
- Refresh requests must use the current access token and must not retry with a stale `Authorization` header.
- Refresh loops are blocked by the web API client.
- When a session expires, redirects keep the current locale.
- Moving web auth to httpOnly cookies is tracked separately and is not part of Batch 4.

## WebSocket authentication and room authorization

- The `/events` and `/tracking` Socket.IO namespaces require the current bearer access token in `handshake.auth.token` or the `Authorization` header.
- Refresh tokens, expired tokens, invalid signatures, and inactive users are rejected before a room can be joined.
- `/events` admin rooms require the database-backed `admin` role.
- Restaurant rooms require an active restaurant profile for the requested tenant.
- Order rooms require an admin or an order participant: the customer, assigned driver, or active restaurant staff member.
- `/tracking` accepts driver location updates only from an authenticated `driver` account.
- Production origins come from `CORS_ORIGINS`; local defaults cover ports 3000, 3002, and 3003.

## HMAC conventions

### Inbound SePay webhook

| Field | Value |
|---|---|
| Header | `x-sepay-signature` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body |
| Secret | `SEPAY_WEBHOOK_SECRET` |
| Replay protection | Redis deduplication key per transaction reference, TTL 24h |

Verification flow:

1. Read `x-sepay-signature`.
2. Compute HMAC-SHA256 over the raw body.
3. Compare with timing-safe equality.
4. Reject mismatch with `WEBHOOK_INVALID_SIGNATURE`.
5. Deduplicate already-processed transaction references.
6. Process and persist the payment result.

### Outbound service webhooks

| Field | Value |
|---|---|
| Header | `X-Signature-SHA256` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body |
| Secret | `WEBHOOK_SECRET` or target-specific secret |

LLM tools and other internal service receivers must verify the signature before processing.

### API key callbacks

Service callbacks to the backend use:

| Header | Secret |
|---|---|
| `x-api-key` | `SERVICE_API_KEY` or an endpoint-specific service key |

## Idempotency

Mutation endpoints that can create money movement or duplicate operational work accept:

```http
Idempotency-Key: <UUID v4>
```

The server stores a 24-hour replay guard. Replayed in-flight or already-processed requests return a stable duplicate response rather than running the mutation twice.

## OpenAPI source

- Canonical spec: [openapi.yaml](./openapi.yaml)
- Changelog: [openapi/changelog.md](./openapi/changelog.md)
- Web client package: `web/packages/api-client`

The OpenAPI contract must describe every web-used Admin and Restaurant endpoint before the endpoint is considered complete.

## CI gate

The OpenAPI validation workflow runs when the spec, backend controllers, or generated API client change. It verifies:

1. Spectral lint.
2. YAML validity.
3. Generated API client typecheck.
4. Contract tests for high-risk behavior when a route changes.
