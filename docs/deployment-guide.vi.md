# Hướng dẫn deploy FoodFlow

## Mục tiêu

Topology production bắt buộc:

- Supabase: PostgreSQL/PostGIS, Realtime, Storage.
- Railway: NestJS API, worker, migrator, Redis; Vercel: Admin, Restaurant.
- Docker Hub: artifact multi-arch immutable sau production smoke.

Không deploy khi secret/CLI auth, current-head test, remote CI hoặc health còn thiếu. Local green không thay thế approval production.

## Nguyên tắc

1. Chỉ làm trong clean release worktree đã được phê duyệt.
2. Remote chỉ giữ `master`; không tạo lại hoặc push historical integration branch theo tên.
3. Rotate mọi key từng xuất hiện trong chat/log/screenshot/ticket/git.
4. Nhập value qua prompt/dashboard, không đưa vào chat/docs/commit.
5. Managed production phải đặt explicit `supabase`/`supabase-postgres`; không fallback Socket.IO/MinIO/BullMQ.
6. Migrate database trước API, API trước hai web app.
7. Docker chỉ promote semver/latest sau production smoke.

## Chuỗi release

Full local gate → GitHub Actions current-head xanh → rotate secret + preflight → Supabase → Railway API/worker → Admin/Restaurant → production smoke → verify `master` → Docker immutable.

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

Railway API/worker/migrator/Redis:

```powershell
powershell -File infra/scripts/vercel-web-preflight.ps1
powershell -File infra/scripts/railway-preflight.ps1
```

Chỉ thêm đúng tên bị preflight báo thiếu và chạy preflight lại.

## 3. Env production

API core:

- `NODE_ENV=production`
- Supabase pooled `DATABASE_URL`, direct `DIRECT_URL`
- managed production `REDIS_URL` cho các cache/history path hiện còn sử dụng Redis
- `REALTIME_PROVIDER=supabase`
- `SUPABASE_REALTIME_PUBLISH_TIMEOUT_MS=5000` để chặn request Broadcast bị treo
- `STORAGE_PROVIDER=supabase`
- `QUEUE_PROVIDER=supabase-postgres`
- `FOODFLOW_PROCESS_ROLE=api` cho API và `FOODFLOW_PROCESS_ROLE=worker` cho worker; production thiếu hoặc sai role sẽ fail startup
- `SUPABASE_URL`, opaque server-only `SUPABASE_SECRET_KEY`, legacy JWT `SUPABASE_SERVICE_ROLE_KEY` chỉ cho Storage, `SUPABASE_PUBLISHABLE_KEY` cho Realtime API kèm ES256 service JWT, `SUPABASE_REALTIME_JWT_PRIVATE_KEY`, `SUPABASE_REALTIME_JWT_KEY_ID`, `SUPABASE_STORAGE_BUCKET=foodflow-public`
- private `SUPABASE_KYC_BUCKET=foodflow-private`, `DRIVER_KYC_MAX_UPLOAD_MB=4`, `DRIVER_KYC_RETRY_LIMIT=3`
- strong `CRON_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- verified `CORS_ORIGINS`, `PASSWORD_RESET_URL_BASE`
- Maps/routing, DeepSeek, SePay, SMTP, FCM, Twilio và webhook secrets.

FCM dùng Firebase Admin SDK/HTTP v1, không dùng server key cũ. Production cần `FCM_PROJECT_ID` và dùng ADC/workload identity hoặc `FCM_SERVICE_ACCOUNT_JSON` một dòng trong secret manager. Compose self-hosted phải có JSON secret cho cả API và worker. Sau deploy phải gửi controlled-token notification; test cấu hình/unit không chứng minh gửi Firebase thật.

Admin:

- `NEXT_PUBLIC_API_URL=https://<railway-domain>/api`
- `NEXT_PUBLIC_ADMIN_URL=https://<admin>.vercel.app`
- `NEXT_PUBLIC_REALTIME_PROVIDER=supabase`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_MAP_PROVIDER=openfreemap`
- `NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty`

Restaurant tương tự, dùng `NEXT_PUBLIC_RESTAURANT_URL`.

Public env được bake vào bundle nên đổi value phải rebuild. OpenFreeMap không cần API key hay billing; Supabase public key vẫn phải được bảo vệ bằng RLS và realtime scope.

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

- đủ mọi migration trong final source head (không dùng số migration lịch sử cố định);
- RLS bật cho `realtime_outbox`, `job_outbox`, `ai_usage_events`;
- chỉ `realtime_outbox` cần thiết nằm trong publication `supabase_realtime`;
- authenticated chỉ đọc channel nằm trong claim `realtime_channels`;
- anon không đọc outbox/job/AI telemetry;
- KYC bucket private; driver chỉ ghi bằng signed grant scope theo owner, Admin read URL hết hạn sau 5 phút, response browser không lộ raw object key;
- Storage bucket/policy đúng và service-role key không xuất hiện trong client.

Realtime smoke phải chứng minh authorized event nhận được, cross-tenant/expired token bị từ chối.

## 5. Railway API, worker, migrator, Redis

Tạo Railway services `foodflow-api` (root `backend`, `backend/railway.toml`), `foodflow-worker` (backend image cùng SHA, command `dist/workers/main.js`), `foodflow-migrate` (migrate image cùng SHA) và managed Redis. Chạy migrator một lần sau backup Supabase và trước API; chỉ deploy Admin/Restaurant trên Vercel. Image migrator chạy `dist/migrations/production-migrate.js`: trước hết kiểm tra checksum mọi migration đã áp dụng; sau đó dùng `SUPABASE_SERVICE_ROLE_KEY` dạng JWT để xoá qua Storage API đúng hai bucket legacy (Supabase sẽ từ chối nếu bucket có object), chỉ resolve bản ghi migration bucket rỗng đã fail sau khi cleanup thành công, rồi chạy `prisma migrate deploy`. Checksum lệch hoặc lỗi inventory/delete bucket sẽ fail-closed trước rollout schema. Không dùng `prisma migrate resolve` để che ba checksum lịch sử đang lệch.

```powershell
railway login
railway link
powershell -File infra/scripts/railway-preflight.ps1
```

Xác minh Railway `/api/healthz`, `/api/readyz`, Redis/Supabase Storage ready và worker log không lộ secret. Nếu API chưa xanh thì không deploy web.

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

Phải chạy release theo đúng thứ tự sau; không gộp hai lượt Docker Publish:

1. Dispatch thủ công **Docker Publish** với `publish_release=false`, `release_tag` rỗng và `promote_latest=false`. Lượt này chỉ publish manifest `sha-<full-commit>` sau runtime smoke/scan cả hai architecture.
2. Sau khi checksum migration và backup đạt, triển khai đúng SHA đó: chạy migrator một lần, pin Railway API/worker vào cùng backend digest và deploy cả hai dự án Vercel từ cùng commit. Xác minh health, readiness, log, revision bằng nhau và smoke role/provider có xác thực.
3. Dispatch lại **Docker Publish** từ đúng `origin/master` không đổi với `publish_release=true` và một `release_tag` ổn định chưa dùng. Gate production yêu cầu API, Admin và Restaurant trả đúng workflow SHA trước khi promote semver. `promote_latest` vẫn là lựa chọn riêng có chủ đích.
4. Tạo/push Git semver tag tại SHA đã xác minh, rồi dispatch thủ công **Release** với tag đó và `source_sha` đầy đủ. Workflow kiểm tra Git tag cùng digest SHA/semver trên Docker Hub và GHCR trước khi tạo GitHub Release và đính kèm SBOM.

Push tag không tự kích hoạt publish hay GitHub Release. GitHub Environment `production` phải có reviewer/protection bắt buộc trước khi cho phép bước 3–4. Worker dùng backend image, không có worker artifact riêng.

## Self-hosted Docker

Đây là profile tương thích, không phải Supabase/Railway/Vercel production:

```powershell
Copy-Item .env.production.example .env.production
$env:IMAGE_TAG='v4.0.0'
docker compose --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml pull --ignore-buildable
docker compose --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml build postgres
docker compose --env-file .env.production \
  -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Phải thay toàn bộ example values và pin semver/SHA, không dùng `latest`. Service `postgres` PostGIS + pgvector là build-only local, không phải release image đã publish; phải `pull --ignore-buildable`, rồi `build postgres`, trước `up`.

## Rollback và điều kiện dừng

- Rollback Vercel về deployment đã verify; database ưu tiên forward migration.
- Không tắt RLS để chữa cháy.
- Docker rollback bằng immutable semver/SHA cũ.
- Dừng release nếu dirty/diverged, secret/auth thiếu, key chưa rotate, gate đỏ, RLS/tenant chưa chứng minh, smoke map/realtime/chatbot/export/payment fail, image chưa scan đủ hai kiến trúc hoặc semver đã tồn tại với digest khác.

Xem [testing guide](testing-guide.vi.md), [security](security-audit-guide.vi.md), [release report](batch4-release-report.md).
