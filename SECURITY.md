# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | Yes               |

## Reporting a Vulnerability

FoodFlow takes security seriously. If you discover a vulnerability, please do **not** open a public issue.

### Disclosure Process

1. **Contact**: Email jasonbmt06@gmail.com with detailed description of the vulnerability
2. **Response**: You will receive an acknowledgment within 48 hours
3. **Triage**: We will validate, assess severity, and confirm the timeline within 5 business days
4. **Fix**: We will develop and test a fix. Critical vulnerabilities are patched within 7 days.
5. **Disclosure**: We coordinate public disclosure. You will be credited in the acknowledgment section (unless you prefer to remain anonymous).

### PGP Key

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
(Coming soon — key will be published at https://keys.openpgp.org)
-----END PGP PUBLIC KEY BLOCK-----
```

### Scope

**In scope:**
- `backend/` — NestJS API server, Prisma ORM, WebSocket (Socket.IO), BullMQ workers
- `web/` — Next.js admin dashboard, restaurant dashboard
- `mobile/` — Flutter customer app, driver app
- `infra/` — Docker Compose, Nginx, N8N workflows
- Authentication and authorization flows (JWT, RBAC, refresh token rotation)
- Rate limiting and brute-force protection
- WebSocket room isolation and GPS tracking authorization

**Out of scope:**
- Third-party services (Gemini API, Google Maps API) — report to those vendors directly
- Social engineering attacks
- Physical security
- Denial of Service (DoS) — we use rate limiting but cannot prevent all volumetric attacks
- Vulnerabilities in outdated dependencies not used by the project
- Issues requiring privileged access (shell on the host machine)

### Responsible Disclosure

- Do not access, modify, or delete data that does not belong to you
- Do not degrade the service or disrupt other users
- Do not publicly disclose the vulnerability before we have had a reasonable time to fix it
- Provide sufficient details to reproduce the issue (steps, payloads, affected endpoints)
- We do not offer a monetary bounty program at this time, but we will publicly acknowledge your contribution

## Security Measures

### Authentication
- JWT access token (HS256, 15 minutes)
- Refresh token rotation (7 days, blocklist in Redis)
- bcrypt password hashing (cost factor 12)
- Account lockout after 5 failed login attempts

### Authorization
- Role-Based Access Control (RBAC): customer, driver, restaurant, admin
- Guards on all protected endpoints
- Admin audit log records every administrative action

### API Security
- Helmet security headers
- CORS restricted origins
- Rate limiting: 100 req/min global, 5 req/min login
- Input validation via Zod/class-validator
- SQL injection prevention (Prisma parameterized queries)

### Real-time Security
- WebSocket CORS origin restriction
- JWT authentication on WebSocket handshake
- Room-based access control (only order's customer can view driver location)

### Data Protection
- No real card data stored (MVP: mock payment)
- Location data only shared with the order's customer
- PII not sent to AI assistant
- API keys excluded from git via `.gitignore`

### Production Upgrade Path
- HS256 to Ed25519 asymmetric keys
- JWKS endpoint for service-to-service auth
- Docker secrets instead of environment variables
- HTTPS/TLS with Let's Encrypt

## Acknowledgments

We thank the following individuals for responsibly disclosing vulnerabilities:

| Name | Contribution | Date |
|------|-------------|------|
| —    | (none yet)  | —    |

To be added here: submit a validated vulnerability report per the disclosure process above.
