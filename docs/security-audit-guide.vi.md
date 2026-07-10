# Hướng dẫn kiểm tra bảo mật

Ngôn ngữ: [English](./security-audit-guide.md) | [Tiếng Việt](./security-audit-guide.vi.md) | [日本語](./security-audit-guide.ja.md)

## Phạm vi production

Managed production dùng Supabase cho PostgreSQL/PostGIS, Realtime, Storage và Vercel cho API/Admin/Restaurant. Socket.IO, Redis/BullMQ và MinIO chỉ là compatibility provider local/self-hosted; không được fallback ngầm khi provider managed bị thiếu.

Mọi credential từng xuất hiện trong chat/screenshot/log/ticket/shell/Git đều xem là đã lộ và phải revoke/rotate trước live smoke/deploy. `NEXT_PUBLIC_*` không được chứa private credential; Supabase anon key không thay thế RLS hay channel claim ngắn hạn.

## Checklist trước production

- [ ] JWT secret dài ít nhất 64 ký tự, tạo bằng `openssl rand -hex 64`.
- [ ] Refresh token blocklist dùng Redis, không dùng bộ nhớ in-memory.
- [ ] Key LLM chỉ nằm trong secret manager hoặc file env bị ignore.
- [ ] Key DeepSeek từng paste vào chat, screenshot, log hoặc ticket phải rotate trước production.
- [ ] File trợ lý local (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.codex/`) và cache/worktree local phải bị ignore.
- [ ] Docker build context phải loại trừ file trợ lý local, dotenv, state CLI provider và credential/key artifact.
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

## Supabase, Vercel và release

- [ ] Production đặt explicit `REALTIME_PROVIDER=supabase`, `STORAGE_PROVIDER=supabase`, `QUEUE_PROVIDER=supabase-postgres`.
- [ ] `realtime_outbox`, `job_outbox`, `ai_usage_events` có RLS; chỉ `realtime_outbox` nằm trong publication realtime.
- [ ] Token realtime ngắn hạn, chỉ `private:`, verify ownership trước ký; anon/cross-tenant bị từ chối.
- [ ] Service-role/JWT Supabase, database, DeepSeek, SePay và notification secret chỉ server-side; Maps browser key bị referrer/API restrict.
- [ ] CORS exact verified HTTPS origins; image non-root hai kiến trúc, Trivy block High/Critical, tag SHA/semver immutable, không deploy `latest` đầu tiên.

```powershell
powershell -File infra/scripts/secret-scan.ps1
git diff --check
git diff --cached --check
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

CI còn phải chạy Gitleaks/CodeQL/audit/Trivy/SBOM/workflow lint/test/promotion. Local xanh không thay CI hay xóa trạng thái exposed.

## Audit định kỳ

- Chạy `pnpm audit` hằng tuần cho dependency vulnerabilities.
- Chạy secret scan trên tracked files trước mỗi PR và scan staged diff trước mỗi commit.
- Review admin audit logs hằng tháng.
- Rotate JWT signing keys hằng quý.
- Penetration test trước major release.
