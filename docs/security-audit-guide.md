# Security Audit Guide

## Pre-Production Checklist

- [ ] JWT secret is 64+ chars, generated via `openssl rand -hex 64`
- [ ] Refresh token blocklist uses Redis (not in-memory)
- [ ] N8N_ENCRYPTION_KEY is backed up securely
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting enabled on all auth endpoints
- [ ] Helmet security headers active
- [ ] PostgreSQL password is strong, not default
- [ ] MinIO credentials changed from defaults
- [ ] All API keys rotated from development values
- [ ] WebSocket origins restricted
- [ ] HTTPS/TLS enabled (Let's Encrypt)
- [ ] Docker containers run as non-root user
- [ ] No secrets in git history (verified with gitleaks)

## Regular Audits

- Run `pnpm audit` weekly for dependency vulnerabilities
- Review admin audit logs monthly
- Rotate JWT signing keys quarterly
- Penetration test before major releases
