# OpenAPI Changelog

## 0.1.0 — 2026-06-09

- Initial OpenAPI 3.1 contract authored (99 endpoints, 12 modules)
- Modules: auth, users, restaurants, menu, orders, drivers, payments, promotions, notifications, support, audit, analytics
- All monetary fields use integer (VND) format
- Shared schemas: PaginationMeta, ProblemDetail (RFC 7807)
- Custom extensions: x-foodflow-actor (public | any-authenticated | customer | driver | restaurant | admin | service)
- F3: JWKS endpoint with version rotation detection (/auth/jwks, /auth/jwks-version)
- F4: Idempotency-Key header on all mutation endpoints
- F8: Wallet balance excludes pending topups
- F11: HMAC webhook signature (x-sepay-signature, X-Signature-SHA256)
- SSE streaming for AI chat endpoint
- Spectral lint ruleset: info-contact-required, operation-tag-defined, operation-operationId-unique
- Generated TypeScript client: @foodflow/api-client
