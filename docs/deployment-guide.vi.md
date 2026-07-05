# Hướng dẫn deploy FoodFlow

Ngôn ngữ: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## Nguyên tắc deploy

Chỉ deploy sau khi integration branch sạch, đã push, đã review và đủ gate xanh. Không deploy từ dirty root worktree, không dùng key đã lộ, không deploy khi Batch 4 còn gate đỏ.

Trạng thái Batch 4 ngày 2026-07-05: `codex/batch4-integration` đã được fast-forward vào `master` tại `3857433`, remote integration branch đã xoá sau khi xác minh patch-equivalence, và current `master` head là `161ce9a`. Đây là mốc cleanup branch và hardening local, không phải approval deploy production. Deploy Supabase và Vercel vẫn bị chặn cho tới khi GitHub Actions access được khôi phục, remote checks của current head xanh, và production secrets/CLI auth hợp lệ.

## Docker local

Chạy service nền cho dev host-run:

```bash
docker compose up -d postgres redis minio
```

Chạy full stack container:

```bash
docker compose up -d --build
```

Health checks:

```bash
curl http://localhost:3001/api/healthz
curl http://localhost:3000/api/healthz
curl http://localhost:3002/api/healthz
```

## Secret stores bắt buộc

| Khu vực | Secret cần có |
|---|---|
| Backend auth | `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| Database/cache | `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, passwords |
| Storage | MinIO/S3 access key và secret key |
| SePay | `SEPAY_API_KEY`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_WEBHOOK_SECRET` |
| AI | `DEEPSEEK_API_KEY` hoặc key của LLM provider được cấu hình |
| Maps | backend `GOOGLE_MAPS_API_KEY`; admin browser `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Deploy CLI | Vercel token, Supabase access token |

Key đã xuất hiện trong chat, log, screenshot, ticket hoặc git history phải rotate trước production.

## Supabase

1. Tạo Supabase project.
2. Lưu Supabase Postgres pooled transaction-mode URL vào backend `DATABASE_URL`.
3. Lưu Supabase Postgres direct/session-mode URL vào backend `DIRECT_URL`; Prisma dùng biến này cho migration qua `directUrl`.
4. Chạy migration trên staging trước:

   ```bash
   cd backend
   pnpm prisma validate
   pnpm prisma migrate deploy
   ```

5. Chỉ bật realtime cho bảng cần realtime. Chạy tenant isolation E2E trước khi mở production data.
6. Supabase service-role key chỉ được lưu server-side, không đưa vào web/mobile.

Mẫu env:

```bash
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres"
```

## Vercel

Deploy web sau khi build Admin và Restaurant pass.

| Vercel project | Root directory | Build command |
|---|---|---|
| FoodFlow Admin | `web` | `pnpm --filter foodflow-admin build` |
| FoodFlow Restaurant | `web` | `pnpm --filter restaurant build` |

Public env:

| App | Variable |
|---|---|
| Admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Restaurant | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_RESTAURANT_URL` |

Admin và Restaurant cố ý fail-closed ở production khi thiếu API, realtime hoặc canonical app URL env. Giá trị localhost chỉ dành cho dev. Không bật `FOODFLOW_ENABLE_DEV_API_REWRITE` trên Vercel; biến này chỉ dùng proxy local cho Restaurant khi dev.

Restrict `NEXT_PUBLIC_GOOGLE_MAPS_KEY` bằng HTTP referrer.

## Backend

- Chạy `pnpm prisma migrate deploy` trước khi nhận traffic.
- Set `NODE_ENV=production`.
- Backend boot validation sẽ reject khi thiếu production infra secret hoặc còn dùng localhost default. Cấu hình `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, JWT secret dài 64+ ký tự, `PASSWORD_RESET_URL_BASE`, `CORS_ORIGINS` chính xác và MinIO/S3 trước khi start API hoặc workers.
- CORS chỉ cho production dashboard/mobile origins.
- Cấu hình SePay webhook URL và `SEPAY_WEBHOOK_SECRET`.
- Cấu hình Redis cho Socket.IO/realtime và rate limiting.
- Giữ `THROTTLER_MEMORY_FALLBACK=false` ở production để Redis outage fail rõ ràng thay vì làm yếu rate limit.
- Cấu hình storage public URL.
- Expose `/api/healthz` cho uptime checks.

## Keep-alive và monitoring

Keep-alive dùng để monitor health, không dùng để che lỗi runtime.

Checks khuyến nghị:

- Backend: `GET /api/healthz`
- Admin: `GET /api/healthz`
- Restaurant: `GET /api/healthz`
- Synthetic flows: login, restaurant order queue, admin exports, AI configured/degraded state, driver map

Không dùng keep-alive để che migration fail, thiếu secret hoặc realtime lỗi.

## Gate trước deploy

- Frozen install trong môi trường sạch.
- Backend: Prisma validate/migrate checks, typecheck, lint, Jest, build.
- Web: API client generation/typecheck, Spectral/OpenAPI lint, Admin/Restaurant typecheck/lint/Vitest/build.
- E2E: Playwright Chromium và Firefox với seed data thật.
- Accessibility: axe không có serious/critical.
- Visual: so với Stitch baseline đã duyệt.
- Security: tracked-file secret scan và staged diff secret scan.
- Tenant isolation: nhà hàng không đọc/sửa dữ liệu nhà hàng khác.

## Rollback

1. Chặn traffic vào release lỗi.
2. Roll back container hoặc Vercel deployment.
3. Không rollback database migration kiểu destructive nếu chưa có migration đảo chiều và review data impact.
4. Giữ log, deployment ID và commit hash cho incident review.
