# 5. JWT Algorithm Migration to Ed25519

Date: 2026-06-07

## Status

Accepted

## Context

Current JWTs are signed with HMAC-SHA256 (HS256) using a symmetric shared secret (`JWT_SECRET`).
Per global rule #4 (JWT auth — Ed25519 + JWKS bắt buộc trong production), production must use
asymmetric Ed25519 signing with a `/.well-known/jwks.json` endpoint. Per rule #23, algorithm
changes must follow a three-phase protocol to avoid evicting active sessions.

## Decision

Execute a three-phase cutover:

**Phase 1 (this ADR) — Dual verify, signing unchanged.**

- `JwtStrategy` uses `secretOrKeyProvider` to route by `alg` header: HS256 → HMAC secret, EdDSA → Ed25519 public key.
- Signing remains HS256 until Phase 2.
- `/.well-known/jwks.json` exposes the Ed25519 public key for external verifiers to pre-cache.
- Feature flag `LEGACY_HS256_FALLBACK=true` (default). When `false`, HS256 tokens are rejected.
- If `JWT_ED25519_PUBLIC_KEY` env is absent, service logs a warning and operates in HS256-only mode.

**Phase 2 — Cut signing to EdDSA (future ADR).**

- Issuer switches to signing with the Ed25519 private key (`JWT_ED25519_PRIVATE_KEY`).
- Both alg paths still verified. Run for ≥ 1 token TTL (default 15 min).

**Phase 3 — Drop legacy verify (future ADR).**

- Set `LEGACY_HS256_FALLBACK=false` and redeploy. Remove fallback code path.

## Consequences

### Positive

- Zero session disruption — existing HS256 tokens remain valid through all three phases.
- JWKS endpoint lets mobile/web clients cache the public key without per-request network hops.
- Asymmetric keys: public key exposure does not enable token forgery.
- Key rotation achievable via kid-based JWKS slot swap without service downtime.

### Negative

- Two verification code paths add complexity during the migration window.
- Ed25519 keys require secure backup and documented rotation runbook.

### Neutral

- `secretOrKeyProvider` replaces static `secretOrKey` in `passport-jwt` Strategy options.
- `@types/passport-jwt` types `done` callback as `string | Buffer`; `crypto.KeyObject` is
  valid at runtime but requires a cast — documented inline at the call site.

## Alternatives Considered

- **Immediate cutover (HS256 → EdDSA in one release):** Evicts all active sessions. Unacceptable.
- **RS256 (RSA-2048):** Wider ecosystem support but larger key size and slower operations.
  Ed25519 preferred per global rule #4.
- **Symmetric rotation (new HMAC secret):** Does not satisfy the asymmetric-key requirement
  for multi-service JWKS verification.

## References

- Global rule #4 — JWT auth Ed25519 + JWKS
- Global rule #23 — JWT algorithm cutover three-phase protocol
- `backend/src/auth/keys/ed25519.service.ts`
- `backend/src/auth/jwt.strategy.ts`
