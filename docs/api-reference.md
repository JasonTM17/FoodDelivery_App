# FoodFlow API Reference

## Canonical sources

- Machine-readable contract: [OpenAPI 3.1](openapi.yaml)
- Behavioral rules: [API contract](api-contract.md)
- Change history: [OpenAPI changelog](openapi/changelog.md)

This page is a concise navigation aid. Generate clients and validate integration from `openapi.yaml`; do not hand-copy a stale endpoint subset into mobile or web.

## Base URL

| Environment | Base |
|---|---|
| Local API | `http://localhost:3001/api` |
| Isolated E2E API | `http://localhost:13001/api` |
| Production | `https://<verified-api-alias>.vercel.app/api` |

The current public base is `/api`; Batch 4 does not use a `/v1` prefix. Production aliases must be HTTPS, credential-free, and verified by the Vercel preflight.

## Response conventions

Successful web/Admin/Restaurant responses:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Errors are RFC 7807 Problem Details, not success-wrapped. Branch on the stable `code`, not translated `detail` text.

```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "The requested tenant is not available to this actor.",
  "instance": "/api/realtime/token",
  "code": "REALTIME_RESTAURANT_CHANNEL_FORBIDDEN"
}
```

## Authentication

User-protected endpoints use `Authorization: Bearer <access-token>`. Access and refresh tokens are different; clients must serialize refresh and never retry a refresh with a stale access header.

| Route | Purpose |
|---|---|
| `POST /auth/register` | Customer-only public sign-up; privileged roles use controlled onboarding/invitation. |
| `POST /auth/login` | Access/refresh token pair and user identity. |
| `POST /auth/refresh` | Refresh the current session. |
| `POST /auth/logout` | Revoke/finish the current session. |
| `POST /auth/forgot-password`, `POST /auth/reset-password` | Password recovery through configured reset origin. |
| `GET /healthz`, `GET /readyz` | Health and readiness, no user token. |

## High-value domain routes

| Area | Examples |
|---|---|
| Discovery/menu | `GET /restaurants/nearby`, `/restaurants/{id}`, `/restaurants/{id}/menu` |
| Cart/order | `/cart`, `POST /orders`, `GET /orders`, `GET /orders/{id}`, cancel/review/status transitions |
| Tracking | `GET /orders/{id}/tracking`, driver online/location/active-order routes |
| Restaurant portal | `/restaurant/orders`, `/restaurant/menu`, `/restaurant/promotions`, staff/insights/reviews/revenue routes |
| Admin | `/admin/kpis`, orders/resources, drivers/map, promotions, support, audit, exports, AI monitor |
| AI | `POST /ai/chat`, `POST /ai/stream`, `GET /ai/history` |
| Payments/webhooks | wallet/COD/SePay endpoints and authenticated webhook contracts |

Exact methods, request schemas, error responses, pagination, and role annotations are in OpenAPI.

## Supabase Realtime

`POST /realtime/token` accepts an authenticated user token and optional `{ orderId?, restaurantId? }`. It verifies ownership, then returns a five-minute Supabase JWT and an explicit `private:` channel allowlist. Admin/Restaurant clients set that token on the Supabase client and subscribe only to `realtime_outbox` rows authorized by RLS.

Do not use the service-role key, `SUPABASE_JWT_SECRET`, raw outbox SQL, or broad wildcard channels in browser/mobile code. Admin, Restaurant, Customer, and Driver managed clients use this scoped contract; the mobile Socket.IO transport is local/self-hosted compatibility only.

## Vercel Cron job drain

`GET|POST /jobs/drain?limit=1..100` drains due PostgreSQL outbox jobs. This is server-to-server only and requires an exact `Authorization: Bearer <CRON_SECRET>` value. It is not a user bearer endpoint and must never be called from web or mobile code.

## Tracking/map contract

`GET /orders/{id}/tracking` is participant scoped. `driverLocation`, `etaMinutes`, and `routePolyline` can be null; null means unavailable, not permission to calculate a straight line or make up an ETA. `routePhase` is required (`pickup` or `dropoff`) so clients do not reuse stale route geometry after pickup.

Driver location submissions preserve the real `sampledAt` timestamp. The backend rejects stale, future, invalid, or unauthorized samples before mutating live state.

## AI contract

DeepSeek is called only by the API. The default requested model is `deepseek-v4-flash`. Missing provider configuration and provider/context failure return typed fail-closed 503 responses; clients must show unavailable/escalation status rather than a canned AI answer.

The Admin monitor reads persisted usage telemetry. It does not prove an AI call until a rotated production key and authenticated live smoke succeed.

## Client-generation policy

1. Treat `docs/openapi.yaml` as the public source of truth.
2. Regenerate/validate shared clients from the same revision used by backend and web.
3. Keep runtime response validation at boundaries; generated types do not validate a network payload.
4. Commit generated client changes only when they are contract-derived and reviewed with the OpenAPI diff.
5. Never synthesize a mobile client schema to get a build passing.

## Validation

```powershell
npx -y @stoplight/spectral-cli lint docs/openapi.yaml \
  --ruleset docs/openapi/.spectral.yaml --fail-severity error
```

OpenAPI lint is necessary but does not prove implementation. Pair it with backend controller tests, web/mobile contract tests, tenant/realtime tests, and production smoke.
