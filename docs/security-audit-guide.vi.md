# Hướng dẫn kiểm tra bảo mật

Ngôn ngữ: [English](./security-audit-guide.md) | [Tiếng Việt](./security-audit-guide.vi.md) | [日本語](./security-audit-guide.ja.md)

## Checklist trước production

- [ ] JWT secret dài ít nhất 64 ký tự, tạo bằng `openssl rand -hex 64`.
- [ ] Refresh token blocklist dùng Redis, không dùng bộ nhớ in-memory.
- [ ] Key LLM chỉ nằm trong secret manager hoặc file env bị ignore.
- [ ] Key DeepSeek từng paste vào chat, screenshot, log hoặc ticket phải rotate trước production.
- [ ] File trợ lý local (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.codex/`) và cache/worktree local phải bị ignore.
- [ ] CORS origins chỉ cho phép domain production.
- [ ] Rate limiting bật trên toàn bộ endpoint auth.
- [ ] Helmet security headers đang hoạt động.
- [ ] PostgreSQL password mạnh, không dùng mặc định.
- [ ] MinIO credentials đã đổi khỏi mặc định.
- [ ] Tất cả API key đã rotate khỏi giá trị development.
- [ ] WebSocket origins bị giới hạn.
- [ ] HTTPS/TLS đã bật.
- [ ] Docker containers chạy bằng non-root user.
- [ ] Git history không chứa secret, đã kiểm bằng gitleaks hoặc secret scan tương đương.

## Audit định kỳ

- Chạy `pnpm audit` hằng tuần cho dependency vulnerabilities.
- Chạy secret scan trên tracked files trước mỗi PR và scan staged diff trước mỗi commit.
- Review admin audit logs hằng tháng.
- Rotate JWT signing keys hằng quý.
- Penetration test trước major release.
