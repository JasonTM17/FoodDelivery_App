# Security Audit Guide

言語: [English](./security-audit-guide.md) | [Tiếng Việt](./security-audit-guide.vi.md) | [日本語](./security-audit-guide.ja.md)

## Pre-Production Checklist

- [ ] JWT secret は 64 文字以上で、`openssl rand -hex 64` で生成します。
- [ ] Refresh token blocklist は Redis を使い、in-memory にしません。
- [ ] LLM provider keys は secret manager または ignored env files のみに保存します。
- [ ] Chat、screenshots、logs、tickets に貼られた DeepSeek key は production 前に rotate します。
- [ ] Local assistant files (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.codex/`) と local tool caches/worktrees は ignore します。
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

## Regular Audits

- Dependency vulnerabilities 用に `pnpm audit` を毎週実行します。
- PR 前に tracked files の secret scan、commit 前に staged diff の secret scan を実行します。
- Admin audit logs を毎月 review します。
- JWT signing keys を四半期ごとに rotate します。
- Major release 前に penetration test を実施します。
