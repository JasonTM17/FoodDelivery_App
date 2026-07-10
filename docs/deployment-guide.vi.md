# Hướng dẫn deploy FoodFlow

## Mục tiêu

Topology production bắt buộc:

- Supabase: PostgreSQL/PostGIS, Realtime, Storage.
- Vercel: NestJS API, Admin, Restaurant.
- Docker Hub: artifact multi-arch immutable sau production smoke.

Không deploy khi secret/CLI auth, current-head test, remote CI hoặc health còn thiếu. Local green không thay thế approval production.

## Nguyên tắc

1. Chỉ làm trong clean integration worktree; không sửa `D:\Food_Delivery`.
2. Remote chỉ giữ `master`; không push local integration branch theo tên.
3. Rotate mọi key từng xuất hiện trong chat/log/screenshot/ticket/git.
4. Nhập value qua prompt/dashboard, không đưa vào chat/docs/commit.
5. Managed production phải đặt explicit `supabase`/`supabase-postgres`; không fallback Socket.IO/MinIO/BullMQ.
6. Migrate database trước API, API trước hai web app.
7. Docker chỉ promote semver/latest sau production smoke.

## Chuỗi release

Full local gate → GitHub Actions current-head xanh → rotate secret + preflight → Supabase → Vercel API → Admin/Restaurant → production smoke → `HEAD:master` → Docker immutable.

Bất kỳ bước nào fail đều dừng các bước sau.

## 1. Gate source

```powershell
git fetch --prune origin
git status --short
git rev-list --left-right --count origin/master...HEAD
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Phải có frozen install, fresh DB migration, backend/web/mobile full suite, Chromium+Firefox, axe serious/critical = 0, visual, tenant isolation, realtime auth, route/ETA shipper, AI fail-closed + live, secret scan và Docker multi-arch scan. Sau đó vẫn cần remote workflows xanh.

## 2. Nhập credential an toàn

Supabase release shell:

```powershell
powershell -File infra/scripts/supabase-env-prompt.ps1 -RunPreflight
```

Prompt nhận `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, pooled `DATABASE_URL` và direct/session `DIRECT_URL`, chỉ giữ trong process rồi xóa.

Vercel:

```powershell
powershell -File infra/scripts/vercel-web-preflight.ps1
powershell -File infra/scripts/vercel-env-prompt.ps1 \
  -Project api -Names DATABASE_URL,DIRECT_URL -PromptValues
```

Chỉ thêm đúng tên bị preflight báo thiếu và chạy preflight lại.

## 3. Env production

API core:

- `NODE_ENV=production`
- Supabase pooled `DATABASE_URL`, direct `DIRECT_URL`
- managed production `REDIS_URL` cho các cache/history path hiện còn sử dụng Redis
- `REALTIME_PROVIDER=supabase`
- `STORAGE_PROVIDER=supabase`
- `QUEUE_PROVIDER=supabase-postgres`
- `SUPABASE_URL`, server-only `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_STORAGE_BUCKET`
- strong `CRON_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- verified `CORS_ORIGINS`, `PASSWORD_RESET_URL_BASE`
- Maps/routing, DeepSeek, SePay, SMTP, FCM, Twilio và webhook secrets.

Admin:

- `NEXT_PUBLIC_API_URL=https://<api>.vercel.app/api`
- `NEXT_PUBLIC_ADMIN_URL=https://<admin>.vercel.app`
- `NEXT_PUBLIC_REALTIME_PROVIDER=supabase`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- browser-restricted `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

Restaurant tương tự, dùng `NEXT_PUBLIC_RESTAURANT_URL`.

Public env được bake vào bundle nên đổi value phải rebuild. Google/Supabase public key vẫn phải bị giới hạn bởi origin/API/RLS.

## 4. Supabase

Sau khi tất cả gate xanh:

```powershell
cd backend
corepack pnpm exec prisma validate --schema prisma/schema.prisma
corepack pnpm run db:migrate:prod
cd ..
```

Không chạy `migrate dev`, reset hoặc demo seed trên production.

Xác minh:

- đủ 22 migration;
- RLS bật cho `realtime_outbox`, `job_outbox`, `ai_usage_events`;
- chỉ `realtime_outbox` cần thiết nằm trong publication `supabase_realtime`;
- authenticated chỉ đọc channel nằm trong claim `realtime_channels`;
- anon không đọc outbox/job/AI telemetry;
- Storage bucket/policy đúng và service-role key không xuất hiện trong client.

Realtime smoke phải chứng minh authorized event nhận được, cross-tenant/expired token bị từ chối.

## 5. Vercel API

Projects: `foodflow-api` root `backend`, `food-delivery-app` root `web/apps/admin`, `foodflow-restaurant` root `web/apps/restaurant`.

```powershell
vercel --cwd backend
# test preview
vercel --prod --cwd backend
```

Xác minh `/api/healthz`, `/api/readyz`, function log không lộ secret và Cron `/api/jobs/drain?limit=50` dùng bearer `CRON_SECRET`. Nếu API chưa xanh thì không deploy web.

## 6. Admin và Restaurant

Gắn verified API alias rồi:

```powershell
vercel --cwd web/apps/admin
vercel --cwd web/apps/restaurant
# test preview
vercel --prod --cwd web/apps/admin
vercel --prod --cwd web/apps/restaurant
```

Kiểm tra `/vi|en|ja/login`, `html lang`, title, console/network, `/api/healthz`, không có 404 shell, localhost request hoặc legacy socket fallback.

## 7. Production smoke

```powershell
$env:API_URL='https://<api>'
$env:ADMIN_URL='https://<admin>'
$env:RESTAURANT_URL='https://<restaurant>'
powershell -File infra/scripts/production-health-check.ps1
```

Sau đó nhập token smoke ngắn hạn qua process env và chạy:

```powershell
powershell -File infra/scripts/post-deploy-smoke.ps1 \
  -RequireAuthenticatedChecks -RequireRoutePolyline -CreateExportJob
```

Phải pass health, locale page, realtime token/channel, DeepSeek live, export, shipper route/polyline, tenant denial, SePay, notification và Storage. Script không in bearer token; xóa token khỏi process sau khi chạy.

## 8. Merge và Docker

Sau production smoke + remote CI xanh:

```powershell
git fetch --prune origin
git push origin HEAD:master
git fetch --prune origin
git rev-list --left-right --count origin/master...HEAD # 0 0
git ls-remote --heads origin                         # chỉ master
```

Tag `v4.0.0` đúng verified master commit. Workflow build `sha-<full-commit>` cho `amd64/arm64`, runtime smoke, Trivy, health rồi mới tạo semver. `latest` chỉ promote manual. Worker chạy từ backend image, không publish worker artifact mới.

## Self-hosted Docker

Đây là profile tương thích, không phải Supabase/Vercel production:

```powershell
Copy-Item .env.production.example .env.production
$env:IMAGE_TAG='v4.0.0'
docker compose --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Phải thay toàn bộ example values và pin semver/SHA, không dùng `latest`.

## Rollback và điều kiện dừng

- Rollback Vercel về deployment đã verify; database ưu tiên forward migration.
- Không tắt RLS để chữa cháy.
- Docker rollback bằng immutable semver/SHA cũ.
- Dừng release nếu dirty/diverged, secret/auth thiếu, key chưa rotate, gate đỏ, RLS/tenant chưa chứng minh, smoke map/realtime/chatbot/export/payment fail, image chưa scan đủ hai kiến trúc hoặc semver đã tồn tại với digest khác.

Xem [testing guide](testing-guide.vi.md), [security](security-audit-guide.vi.md), [release report](batch4-release-report.md).
