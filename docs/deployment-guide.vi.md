# Hướng dẫn deploy FoodFlow

Ngôn ngữ: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## Nguyên tắc deploy

Chỉ deploy sau khi integration branch sạch, đã push, đã review và đủ gate xanh. Không deploy từ dirty root worktree, không dùng key đã lộ, không deploy khi Batch 4 còn gate đỏ.

## Docker local

Chạy service nền cho dev host-run:

```bash
docker compose up -d postgres redis minio n8n
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
| Database/cache | `DATABASE_URL`, `REDIS_URL`, passwords |
| Storage | MinIO/S3 access key và secret key |
| SePay | `SEPAY_API_KEY`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_WEBHOOK_SECRET` |
| AI | `DEEPSEEK_API_KEY`, optional legacy `GEMINI_API_KEY` / `N8N_API_KEY` |
| Maps | backend `GOOGLE_MAPS_API_KEY`; admin browser `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Deploy CLI | Vercel token, Supabase access token |

Key đã xuất hiện trong chat, log, screenshot, ticket hoặc git history phải rotate trước production.

## Supabase

1. Tạo Supabase project.
2. Lưu Postgres connection string vào backend `DATABASE_URL`.
3. Chạy migration trên staging trước:

   ```bash
   cd backend
   pnpm prisma validate
   pnpm prisma migrate deploy
   ```

4. Chỉ bật realtime cho bảng cần realtime. Chạy tenant isolation E2E trước khi mở production data.
5. Supabase service-role key chỉ được lưu server-side, không đưa vào web/mobile.

## Vercel

Deploy web sau khi build Admin và Restaurant pass.

| Vercel project | Root directory | Build command |
|---|---|---|
| FoodFlow Admin | `web` | `pnpm --filter foodflow-admin build` |
| FoodFlow Restaurant | `web` | `pnpm --filter restaurant build` |

Public env:

| App | Variable |
|---|---|
| Admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Restaurant | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` |

Restrict `NEXT_PUBLIC_GOOGLE_MAPS_KEY` bằng HTTP referrer.

## Backend

- Chạy `pnpm prisma migrate deploy` trước khi nhận traffic.
- Set `NODE_ENV=production`.
- CORS chỉ cho production dashboard/mobile origins.
- Cấu hình SePay webhook URL và `SEPAY_WEBHOOK_SECRET`.
- Cấu hình Redis cho Socket.IO/realtime và rate limiting.
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
