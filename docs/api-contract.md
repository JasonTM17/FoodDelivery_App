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

## Managed-production realtime and job drain

| Method | Route | Authentication | Contract |
|---|---|---|---|
| `POST` | `/realtime/token` | User bearer access token | Optional `{ orderId?, restaurantId? }`. Returns `{ provider: "supabase", token, expiresAt, channels }`; the JWT expires after five minutes and all channels are explicit private scopes. |
| `GET` | `/jobs/drain?limit=1..100` | `Authorization: Bearer ${CRON_SECRET}` | Vercel Cron drain for due PostgreSQL outbox jobs. Returns `{ claimed, completed, failed, retried }`. |
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
- `/tracking` accepts driver location updates only from an authenticated `driver` account.
- `driver:location.timestamp` is the original GPS sample capture time in ISO UTC. Offline-buffered mobile pings must preserve that timestamp when flushed after reconnect instead of replacing it with flush time.
- `/notifications` derives the user room from the verified token; clients cannot select another user's room.
- `/dispatch` accepts only `driver` accounts, joins only `driver:<authenticated-user-id>`, and rejects offer responses whose driver ID differs from the authenticated user.
- Production origins come from `CORS_ORIGINS`; local defaults cover ports 3000, 3002, and 3003.

## Order tracking REST snapshot

- `POST /driver/location` is driver-only and accepts a real device GPS sample with required capture `timestamp`. The shared tracking pipeline rejects stale, future, out-of-bounds, over-speed, and teleporting samples with `422 DRIVER_LOCATION_REJECTED`; accepted samples update live presence and publish tenant-scoped order/admin events.
- `GET /orders/{id}/tracking` is order-participant scoped: customer-owned orders, assigned driver orders, active restaurant staff for the order's restaurant tenant, or admin. It returns only real provider-cache/database telemetry for an order the authenticated actor can access.
- `driverLocation`, `etaMinutes`, and `routePolyline` are nullable; clients must treat nulls as unavailable data, not fabricate straight-line ETA or route geometry.
- `routePhase` is required and is `pickup` before pickup, `dropoff` after pickup. Mobile and web clients must use it to avoid reusing stale pickup geometry for customer-bound delivery.
- Customer mobile and Restaurant web hydrate this snapshot before subscribing to realtime events, then let realtime `delivery:eta_updated` replace or clear the planned route.

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
