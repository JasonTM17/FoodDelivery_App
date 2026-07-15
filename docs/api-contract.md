# API Contract

Languages: [English](./api-contract.md) | [Tiếng Việt](./api-contract.vi.md) | [日本語](./api-contract.ja.md)

This document defines the web/admin/restaurant API contract used by Batch 4. It does not change legacy customer or mobile contracts unless an endpoint is explicitly versioned or aliased.

## Base path and versioning policy

- Current routes are mounted below `/api`; route examples in this document are relative to that base.
- Batch 4 does not expose a `/v1` prefix. A future version prefix may be introduced only together with an updated OpenAPI server and migration policy.
- Breaking changes require a new version or a documented compatibility alias. Additive changes can remain on the current route.

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
  "type": "about:blank",
  "title": "Validation Error",
  "status": 422,
  "detail": "Email khong dung dinh dang",
  "instance": "/api/auth/register",
  "code": "VALIDATION_INVALID_EMAIL"
}
```

Clients must branch on `code`, not translated text.

## AI chat

All AI routes require a user access token. The provider key is server-only.

| Method | Route | Contract |
|---|---|---|
| `POST` | `/ai/chat` | Sends message, sessionId?, orderId?; message is 1–4,000 trimmed characters, `sessionId` is a server UUID, and `orderId` is an owned UUID/FoodFlow order code. Returns a role-scoped, safety-filtered live-provider reply with action answered or escalated, `grounded`, and optional tool metadata. |
| `GET` | `/ai/history?sessionId=<uuid>` | Returns the caller's own active AI-support session and up to 50 persisted turns. Omit `sessionId` for the latest session. |
| `POST` | `/ai/stream` | Authenticated SSE; emits `thinking`, one completed `response`, optional `escalated`, and `done`. It does not emit synthetic word tokens. |

The chat endpoint fails closed with HTTP 503 and one of `AI_PROVIDER_NOT_CONFIGURED`, `AI_PROVIDER_UNAVAILABLE`, or `AI_CONTEXT_UNAVAILABLE`. Invalid/mismatched session and order context returns `AI_SESSION_NOT_FOUND`, `ORDER_NOT_FOUND`, or `SESSION_ORDER_MISMATCH` with 404/400. Clients must show an honest unavailable state and must not render a fallback assistant message.

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

## Private driver KYC

Every KYC route is authenticated and role-scoped. Driver documents are private storage objects, not public media assets.

| Method | Route | Actor | Contract |
|---|---|---|---|
| `POST` | `/driver/kyc/uploads` | Driver | Requests one signed grant for `idCardFront`, `idCardBack`, `driverLicense`, or `vehicleRegistration`; accepts JPEG/PNG/WebP metadata from 1 KiB through 4 MiB and returns `{ uploadUrl, objectKey, headers }`. |
| `POST` | `/driver/kyc` | Driver | Submits license/vehicle fields and exactly four opaque private object keys owned by the caller. Public/signed URLs, duplicate keys, invalid signatures, a second pending submission, and exhausted retries are rejected. |
| `GET` | `/driver/kyc/status` | Driver | Returns verified/status, vehicle/license details, accepted terms, latest review state, and remaining attempts for the caller only. |
| `GET` | `/admin/users/{userId}/kyc` | Admin | Returns real submissions with five-minute signed read URLs when documents are valid. Raw object keys are never returned. |
| `POST` | `/admin/users/{userId}/kyc/review` | Admin | Atomically approves or rejects one pending submission; rejection requires a reason and a reviewed submission cannot be reviewed again. |

The client uploads to `uploadUrl` using only the exact returned headers. It must not forward the FoodFlow API bearer token to storage, derive a public URL, persist the signed URL, or replace `objectKey` with any URI. Production uses a dedicated private `SUPABASE_KYC_BUCKET`; MinIO follows the same contract only in explicit local/self-hosted mode.

## Managed-production realtime and job drain

| Method | Route | Authentication | Contract |
|---|---|---|---|
| `POST` | `/realtime/token` | User bearer access token | Optional `{ orderId?, restaurantId? }`. Returns `{ provider: "supabase", token, expiresAt, channels }`; the JWT expires after five minutes and all channels are explicit private scopes. |
| `GET` | `/jobs/drain?limit=1..100` | `Authorization: Bearer ${CRON_SECRET}` | Railway worker recovery/one-off drain for due PostgreSQL outbox jobs. Returns `{ claimed, completed, failed, retried }`. |
| `POST` | `/jobs/drain?limit=1..100` | `Authorization: Bearer ${CRON_SECRET}` | Same drain contract for secured worker invocations. |

Token issue verifies order/restaurant ownership before signing. Customer, driver, restaurant, and admin roles receive only their documented user/order/tenant/admin channels. Cross-tenant requests fail with `REALTIME_ORDER_CHANNEL_FORBIDDEN` or `REALTIME_RESTAURANT_CHANNEL_FORBIDDEN`. Missing signing configuration fails with `SUPABASE_REALTIME_NOT_CONFIGURED`.

Supabase RLS permits an authenticated client to read `realtime_outbox` rows only when `channel` appears in its JWT `realtime_channels` claim. The anon role and broad public channels are not part of this contract.

## Socket.IO compatibility authentication and room authorization

Socket.IO is the explicit local/self-hosted realtime provider. It is not an implicit managed-production fallback.

- The `/events`, `/tracking`, `/notifications`, and `/dispatch` Socket.IO namespaces require the current bearer access token in `handshake.auth.token` or the `Authorization` header.
- Refresh tokens, expired tokens, invalid signatures, and inactive users are rejected before a room can be joined.
- `/events` admin rooms require the database-backed `admin` role.
- Restaurant rooms require an active restaurant profile for the requested tenant.
- Order rooms require an admin or an order participant: the customer, assigned driver, or active restaurant staff member.
- `/tracking` accepts driver location updates only from an authenticated `driver` account. Rejected samples emit `driver:location_rejected` with one of `invalid_coordinates`, `out_of_bbox`, `invalid_bearing`, `invalid_speed`, `speed_exceeded`, `poor_accuracy`, `invalid_timestamp`, `stale_timestamp`, `future_timestamp`, `driver_offline`, or `teleportation`.
- `driver:location.timestamp` is the original GPS sample capture time in ISO UTC. Offline-buffered mobile pings must preserve that timestamp when flushed after reconnect instead of replacing it with flush time.
- `/notifications` derives the user room from the verified token; clients cannot select another user's room.
- `/dispatch` accepts only `driver` accounts, joins only `driver:<authenticated-user-id>`, and rejects offer responses whose driver ID differs from the authenticated user.
- Production origins come from `CORS_ORIGINS`; local defaults cover ports 3000, 3002, and 3003.

## Order tracking REST snapshot

- `POST /driver/location` is driver-only and accepts a real device GPS sample with required capture `timestamp`. The same semantic pipeline used by WebSocket rejects malformed coordinates, bearing outside `[0, 360)`, negative or over-150 km/h speed, accuracy outside `0..50` metres, stale/future timestamps, Offline sessions, out-of-bounds movement, and teleporting samples with `422 DRIVER_LOCATION_REJECTED` plus the reason above. Accepted samples update live presence and publish tenant-scoped order/admin events.
- `POST /driver/dispatch/offers/{orderId}/respond` is driver-only. It accepts `{ offerToken, decision: "accept"|"reject" }`, binds the response to the bearer identity, consumes a short-lived token once, and returns `409` for invalid/expired/raced offers. Offer state lives in PostgreSQL; only a SHA-256 token hash is persisted.
- `GET /orders/{id}/tracking` is order-participant scoped: customer-owned orders, assigned driver orders, active restaurant staff for the order's restaurant tenant, or admin. It returns only real provider-cache/database telemetry for an order the authenticated actor can access.
- `driverLocation`, `etaMinutes`, and `routePolyline` are nullable; clients must treat nulls as unavailable data, not fabricate straight-line ETA or route geometry.
- `routePhase` is required and is `pickup` before pickup, `dropoff` after pickup. Mobile and web clients must use it to avoid reusing stale pickup geometry for customer-bound delivery.
- Customer mobile and Restaurant web hydrate this snapshot before subscribing to realtime events, then let realtime `delivery:eta_updated` replace or clear the planned route.

## HMAC conventions

### Inbound SePay webhook

| Field | Value |
|---|---|
| Headers | `x-sepay-signature: sha256={hex}`, `x-sepay-timestamp: {unix_seconds}` |
| Algorithm | HMAC-SHA256 |
| Input | `{timestamp}.{raw_request_body}` |
| Secret | `SEPAY_WEBHOOK_SECRET` |
| Replay protection | Reject timestamps outside ±5 minutes; durable Postgres unique receipt per SePay transaction `id` |

Verification flow:

1. Read both SePay signature and timestamp headers.
2. Reject stale timestamps, then compute HMAC-SHA256 over `{timestamp}.{raw_body}` without re-serializing JSON.
3. Compare with timing-safe equality.
4. Reject mismatch with `SEPAY_WEBHOOK_SIGNATURE_INVALID`.
5. Claim SePay's stable transaction `id` in `payment_webhook_receipts`; the database unique constraint remains authoritative across retries, restarts and historical replays.
6. Require an inbound transfer whose beneficiary account, payment code and exact VND amount match the pending intent before persisting payment success.
7. Return exactly `{"success": true}` for every accepted delivery. Valid but non-payable transfers are stored as `ignored` or `manual_review` and alerted without releasing the order.

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
