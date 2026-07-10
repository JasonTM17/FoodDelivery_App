# Security Audit Guide

言語: [English](./security-audit-guide.md) | [Tiếng Việt](./security-audit-guide.vi.md) | [日本語](./security-audit-guide.ja.md)

## Production scope

Managed production は Supabase（PostgreSQL/PostGIS、Realtime、Storage）と Vercel（API/Admin/Restaurant）です。Socket.IO、Redis/BullMQ、MinIO は local/self-hosted compatibility provider であり、managed provider 不足時の暗黙 fallback ではありません。

Chat/screenshot/log/ticket/shell/Git に出た credential は exposed として live smoke/deploy 前に revoke/rotate します。`NEXT_PUBLIC_*` に private credential を入れず、Supabase anon key は RLS/short-lived channel claim の代わりではありません。

## Pre-Production Checklist

- [ ] JWT secret は 64 文字以上で、`openssl rand -hex 64` で生成します。
- [ ] Refresh token blocklist は Redis を使い、in-memory にしません。
- [ ] LLM provider keys は secret manager または ignored env files のみに保存します。
- [ ] Chat、screenshots、logs、tickets に貼られた DeepSeek key は production 前に rotate します。
- [ ] Local assistant files (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.codex/`) と local tool caches/worktrees は ignore します。
- [ ] Docker build contexts は local assistant files、dotenv files、provider CLI state、credential/key artifacts を除外します。
- [ ] CORS origins は production domains に限定します。
- [ ] Auth endpoints では rate limiting を有効にします。
- [ ] Helmet security headers が有効です。
- [ ] PostgreSQL password は強力で、default ではありません。
- [ ] MinIO credentials は default から変更済みです。
- [ ] すべての API keys は development values から rotate 済みです。
- [ ] WebSocket origins は制限されています。
- [ ] HTTPS/TLS が有効です。
- [ ] Docker containers は non-root user で実行します。
- [ ] Git history に secrets がないことを gitleaks または同等の secret scan で確認します。

## Supabase, Vercel, and release

- [ ] Production は explicit `REALTIME_PROVIDER=supabase`、`STORAGE_PROVIDER=supabase`、`QUEUE_PROVIDER=supabase-postgres`。
- [ ] `realtime_outbox`、`job_outbox`、`ai_usage_events` に RLS、realtime publication は `realtime_outbox` のみ。
- [ ] Realtime token は short TTL、`private:` channels、signing 前 ownership check、anon/cross-tenant deny。
- [ ] Supabase service-role/JWT、database、DeepSeek、SePay、notification secret は server-side。Browser Maps key は referrer/API restriction。
- [ ] Exact verified HTTPS CORS、non-root dual-arch images、Trivy High/Critical block、immutable SHA/semver、initial `latest` deploy 禁止。

```powershell
powershell -File infra/scripts/secret-scan.ps1
git diff --check
git diff --cached --check
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

CI は Gitleaks/CodeQL/audit/Trivy/SBOM/workflow lint/test/promotion も実行します。Local green は remote CI や exposure resolution の代替ではありません。

## Regular Audits

- Dependency vulnerabilities 用に `pnpm audit` を毎週実行します。
- PR 前に tracked files の secret scan、commit 前に staged diff の secret scan を実行します。
- Admin audit logs を毎月 review します。
- JWT signing keys を四半期ごとに rotate します。
- Major release 前に penetration test を実施します。
