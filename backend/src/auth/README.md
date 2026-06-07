# auth — Backend Service

## Purpose

Authentication + authorization layer cho FoodFlow. Phát hành JWT access tokens (15min TTL) + opaque refresh tokens (7-day rolling), enforce role-based access (customer/driver/restaurant/admin), rate-limit login, account lockout sau N failed attempts. Gọi bởi: mọi controller protected (qua `JwtAuthGuard`), gateway WebSocket, AI service-to-service calls.

## API surface

- `POST /auth/register` — Customer/restaurant signup, email + phone verification
- `POST /auth/login` — Email/phone + password → access + refresh
- `POST /auth/refresh` — Rotate refresh token, re-issue access
- `POST /auth/logout` — Revoke current refresh token
- `POST /auth/logout-all` — Revoke all refresh tokens for user
- `GET /auth/profile` — Return current user from JWT
- `POST /auth/forgot-password` — Send reset email
- `POST /auth/reset-password` — Apply token-based reset
- Schemas: `auth.zod.ts`

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | yes | — | Symmetric secret (≥64 chars). Will migrate to Ed25519 keypair v0.3 |
| `JWT_REFRESH_SECRET` | yes | — | Refresh token HMAC secret |
| `JWT_ACCESS_TTL` | no | `15m` | Access token expiry |
| `JWT_REFRESH_TTL` | no | `7d` | Refresh token expiry |
| `LOGIN_LOCKOUT_THRESHOLD` | no | `5` | Failed attempts before lock |
| `LOGIN_LOCKOUT_WINDOW_MIN` | no | `15` | Lockout window minutes |

## Run locally

```bash
cd backend
pnpm install
pnpm prisma generate
pnpm start:dev
# Default port 3001, /api/auth/...
```

## Test

```bash
cd backend
npx jest auth         # unit + integration tests
# Coverage gate: ≥ 90% (critical service per global rule #5)
```

## Runbook

- **Rotate JWT secret:** Set new `JWT_SECRET` in env, redeploy. Old refresh tokens invalidated. Plan dual-secret support v0.3.
- **Unlock user account:** `UPDATE users SET failed_login_count=0, locked_until=NULL WHERE id='<uuid>'`.
- **Suspect token theft:** Use `/auth/logout-all` from admin panel for that user.
- **JWKS migration (v0.3):** Follow ADR cutover protocol — dual verify → cut signing → drop legacy.
