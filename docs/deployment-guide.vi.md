# Hướng dẫn deploy FoodFlow

Ngôn ngữ: [English](deployment-guide.md) | [Tiếng Việt](deployment-guide.vi.md) | [日本語](deployment-guide.ja.md)

## Nguyên tắc deploy

Chỉ deploy sau khi integration branch sạch, đã push, đã review và đủ gate xanh. Không deploy từ dirty root worktree, không dùng key đã lộ, không deploy khi Batch 4 còn gate đỏ.

Trạng thái Batch 4 ngày 2026-07-08: remote cleanup đã recheck tại `118459e539eecb2dbd61e033431b7f4b5104f0e0`, và `git ls-remote --heads origin` chỉ trả `refs/heads/master`. Local head mới nhất trước docs refresh hiện tại là `188a256`, vẫn ahead `origin/master` và là fast-forward candidate cho `master`. Docker stack mới đã rebuild Backend/Admin/Restaurant từ source hiện tại, health check pass cả 3 service, và Playwright Chromium/Firefox pass 70/70 gồm axe serious/critical smoke, visual contract, realtime và tenant isolation; xem [Batch 4 release report](batch4-release-report.md). Đây là bằng chứng verify local, không phải approval deploy production. Vercel project `food-delivery-app` đã được link và chỉnh root/build settings cho Admin app, nhưng production env vẫn thiếu biến bắt buộc; deploy Supabase và Vercel vẫn bị chặn cho tới khi GitHub Actions access được khôi phục, remote checks của current head xanh, production secrets đã rotate/hợp lệ, Supabase CLI/auth khả dụng, backend/API URL hợp lệ và Vercel env đầy đủ.

## Batch 4 update 2026-07-09

Local head `f5ba366` is 71 commits ahead of `origin/master`. Supabase realtime/storage/queue foundation has landed. Backend full Jest passed 116 suites / 849 tests after the Supabase queue drain work. Vercel projects now exist for API/Admin/Restaurant: `foodflow-api`, `food-delivery-app`, and `foodflow-restaurant`. Generated app-owned `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CRON_SECRET` were stored as sensitive env vars on `foodflow-api` without printing values.

Production deploy is still blocked because real Supabase database/service-role/JWT/anon keys, Redis, Google Maps, DeepSeek, SePay, SMTP, FCM, and Twilio values are not configured yet. Supabase MCP OAuth is logged in, but Supabase CLI still needs `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`, and `DIRECT_URL` before migrations can run.

Vercel Hobby cron can run only once per day on the current account, so the committed `/api/jobs/drain` cron is daily. Use Vercel Pro minute cron or another approved scheduler before relying on `QUEUE_PROVIDER=supabase-postgres` for time-sensitive dispatch/order-timeout jobs.

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
| Maps | backend `GOOGLE_MAPS_API_KEY` và `OSRM_URL` riêng; Admin/Restaurant browser `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| Deploy CLI | Vercel token, Supabase access token |

Key đã xuất hiện trong chat, log, screenshot, ticket hoặc git history phải rotate trước production.

Production config không phải secret nhưng bắt buộc: cấu hình `DELIVERY_BASE_FEE_VND` theo base delivery fee đã duyệt. Backend boot validation sẽ chặn khi thiếu pricing config để không tạo đơn với phí MVP hardcoded.

Kiểm tra deploy readiness mới nhất ngày 2026-07-08: Vercel CLI đã có auth và project `food-delivery-app` đã link/config cho Admin, nhưng production env vẫn thiếu `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_ADMIN_URL`, và `NEXT_PUBLIC_GOOGLE_MAPS_KEY`. Supabase MCP đã add/login OAuth cho project ref `lvanszgszzfopusboich`, nhưng deploy bằng Supabase CLI vẫn cần `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`, và `DIRECT_URL` trong release shell. Chưa deploy production.

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
| `foodflow-api` | `backend` | `pnpm prisma generate && pnpm build` |
| `food-delivery-app` | `web/apps/admin` | `cd ../.. && pnpm --filter foodflow-admin build` |
| `foodflow-restaurant` | `web/apps/restaurant` | `cd ../.. && pnpm --filter restaurant build` |

Public env:

| App | Variable |
|---|---|
| Admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_REALTIME_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Restaurant | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RESTAURANT_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_REALTIME_PROVIDER`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Chay preflight truoc khi deploy de kiem tra project settings va danh sach env production ma khong in gia tri secret:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-web-preflight.ps1
```

Neu thieu env, dung helper local de in contract/lenh an toan, roi truyen dung ten bien ma preflight bao thieu thay vi paste secret vao chat, docs hoac shell history:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1 -Project api -Names DATABASE_URL,DIRECT_URL -LinkProjects
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\vercel-env-prompt.ps1 -Project api -Names DATABASE_URL,DIRECT_URL -PromptValues
```

Khi dung `-PromptValues`, helper khong deploy, khong ghi `.env`, gui value vao `vercel env add` qua stdin, dung hidden input cho secret, va dung non-sensitive mode chi cho public/non-secret config.

Admin và Restaurant cố ý fail-closed ở production khi thiếu API, realtime, canonical app URL hoặc map key bắt buộc. Giá trị localhost chỉ dành cho dev. Không bật `FOODFLOW_ENABLE_DEV_API_REWRITE` trên Vercel; biến này chỉ dùng proxy local cho Restaurant khi dev.

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
- Synthetic flows: login, restaurant order queue và live tracking map, admin exports, AI configured/degraded state, driver map

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
