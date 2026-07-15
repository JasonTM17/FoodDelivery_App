# Security Audit Guide

Languages: [English](./security-audit-guide.md) | [Tiếng Việt](./security-audit-guide.vi.md) | [日本語](./security-audit-guide.ja.md)

## Production scope

Managed production uses Supabase for PostgreSQL/PostGIS, Realtime, and Storage; Railway for API, worker, migrator, and Redis; and Vercel for Admin/Restaurant. Local/self-hosted Socket.IO, Redis/BullMQ, and MinIO are compatibility providers only; a missing managed provider must never silently fall back to them.

Every credential pasted into chat, screenshots, logs, tickets, shell history, or Git history is treated as exposed. Revoke/rotate it before any live smoke or deployment. Keep values in a provider secret store or an ignored local prompt session; docs and commits contain names, never values.

| Class | Examples | Allowed location |
|---|---|---|
| Server secret | Database URLs, Supabase service role/JWT, JWT/Cron, DeepSeek, SePay, SMTP/FCM/Twilio | Railway/Supabase secret store or secure release shell |
| Deployment secret | Docker Hub, GitHub, Supabase, Vercel tokens | Provider/CI secret store or secure local prompt |
| Browser-visible identifier | Supabase URL/anon key, Maps key, public origins | Build environment with origin/API/RLS restrictions |
| Local compatibility | Docker/Postgres/Redis/MinIO development values | Ignored local env only |

`NEXT_PUBLIC_*` must never contain a private credential. A Supabase anon key is not authorization; RLS and short-lived channel claims remain mandatory.

## Pre-Production Checklist

- [ ] JWT secret is 64+ chars, generated via `openssl rand -hex 64`
- [ ] Refresh-token/session state uses its configured durable provider, never an in-memory production fallback
- [ ] LLM provider keys are stored only in secret managers or ignored env files
- [ ] DeepSeek keys pasted into chat, screenshots, logs, or tickets are rotated before production
- [ ] Local assistant files (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.codex/`) and local tool caches/worktrees are ignored
- [ ] Docker build contexts exclude local assistant files, dotenv files, provider CLI state, and credential/key artifacts
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting enabled on all auth endpoints
- [ ] Helmet security headers active
- [ ] Supabase pooled/direct database URLs are server-only; any self-hosted PostgreSQL password is strong and non-default
- [ ] Managed Supabase Storage policy is least privilege; self-hosted MinIO credentials are changed from defaults
- [ ] Driver KYC uses a dedicated private bucket, owner-scoped short-lived upload grants, five-minute Admin reads, MIME/size/magic-byte checks, and no public/raw-key response
- [ ] All API keys rotated from development values
- [ ] Realtime is explicit: Supabase JWT/RLS private channels in managed production, restricted Socket.IO origins only for compatibility mode
- [ ] HTTPS/TLS enabled (Let's Encrypt)
- [ ] Docker containers run as non-root user
- [ ] No secrets in git history (verified with gitleaks)

## Supabase, Railway, Vercel, and release checks

- [ ] `REALTIME_PROVIDER=supabase`, `STORAGE_PROVIDER=supabase`, and `QUEUE_PROVIDER=supabase-postgres` are explicit in the API production environment.
- [ ] `realtime_outbox`, `job_outbox`, and `ai_usage_events` have RLS; `realtime_outbox` is rollback-only and is not in a Realtime publication. Managed realtime uses authorized private Broadcast channels.
- [ ] Realtime tokens have short TTL, only `private:` channels, ownership verification before signing, and cross-tenant/anon denial tests.
- [ ] `SUPABASE_SECRET_KEY` and `SUPABASE_REALTIME_JWT_PRIVATE_KEY` are sealed server-only values and absent from browser bundles/logs.
- [ ] FCM has `FCM_PROJECT_ID` plus either workload identity/ADC or sealed `FCM_SERVICE_ACCOUNT_JSON`; the legacy server key is absent. Before release, send to a controlled device token and record only redacted success/failure evidence.
- [ ] `SUPABASE_KYC_BUCKET`, upload limit, and retry limit are explicit; storage PUT requests never receive the FoodFlow bearer token.
- [ ] Browser Maps key is restricted by referrer/API/quotas; the server Maps key is separate.
- [ ] Production CORS has exact verified Admin/Restaurant origins, no wildcard; all public aliases are HTTPS.
- [ ] Docker images are non-root, verified on `amd64` and `arm64`, scanned with High/Critical blocking, and released by immutable SHA/semver digest.
- [ ] CI actions that receive release secrets are pinned to immutable commits; `latest` is not an initial deployment source.

## Required release scans

```powershell
# Reports only pattern class and file path, never a secret value.
powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/secret-scan.ps1
git diff --check
git diff --cached --check
powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Remote CI must additionally run Gitleaks, CodeQL, dependency audit, Trivy, SBOM, workflow lint, tests, and protected release promotion. Local success cannot clear an exposure or replace fresh remote CI.

## Incident response

1. Stop deploy/publish and retain only redacted evidence.
2. Revoke/rotate at the provider; do not reuse the credential for a final test.
3. Identify affected environments, logs, deployments, and history.
4. Update secure stores, invalidate sessions/webhooks where appropriate, and rerun preflight.
5. Rescan and rerun impacted tests/smoke; rewrite history only through repository-owner coordination.
6. Record the incident without the value.

## Regular Audits

- Run `pnpm audit` weekly for dependency vulnerabilities
- Run a tracked-file and staged-diff secret scan before every PR/commit:

  ```powershell
  powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\secret-scan.ps1
  ```

  The scanner reports only pattern class and file path; it does not print secret values.
- Review admin audit logs monthly
- Rotate JWT signing keys quarterly
- Penetration test before major releases
