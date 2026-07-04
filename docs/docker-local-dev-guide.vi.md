# Hướng dẫn Docker và phát triển local

Tài liệu này mô tả cách dựng FoodFlow Batch 4 trên máy local. Nó được tách khỏi deployment guide vì các giá trị mặc định trong Docker local chỉ dành cho phát triển, không được sao chép sang secret manager production.

## Điều kiện cần

- Docker Desktop hoặc Docker Engine có Compose v2
- Node.js 20+ và pnpm nếu chạy backend hoặc web từ host
- Flutter stable nếu kiểm tra mobile
- Worktree sạch khi xác minh release gate

## Quy tắc env và secret

Khi cần chạy lệnh từ host, copy các file example sang file env local đã bị ignore:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item web/apps/admin/.env.example web/apps/admin/.env.local
Copy-Item web/apps/restaurant/.env.example web/apps/restaurant/.env.local
```

Credential production phải nằm trong Supabase, Vercel hoặc secret manager của backend host. Không commit `.env`, file auth của CLI, storage state, certificate riêng tư, database dump hoặc provider token. Bất kỳ key AI hoặc map nào từng được dán vào chat/log đều phải xem là đã lộ và phải rotate trước production.

## Các chế độ chạy local

### Chỉ chạy hạ tầng

Dùng chế độ này khi muốn chạy backend, web hoặc mobile từ host, còn PostgreSQL/PostGIS, Redis và MinIO chạy trong container:

```powershell
docker compose up -d postgres redis minio
```

Sau đó chạy lệnh theo từng app từ host, ví dụ:

```powershell
cd backend
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
pnpm start:dev
```

### Full standalone stack

Dùng cho E2E trình duyệt và xác minh local kiểu release. Dockerfile web bake `NEXT_PUBLIC_API_URL` lúc build, nên cần set trước khi rebuild image:

```powershell
$env:NEXT_PUBLIC_API_URL = "http://[::1]:3001/api"
$env:CORS_ORIGINS = "http://localhost:3000,http://localhost:3002,http://localhost:3003,http://[::1]:3000,http://[::1]:3002,http://[::1]:3003"
docker compose up -d --build backend admin restaurant
```

Compose sẽ khởi động PostgreSQL/PostGIS, Redis, MinIO, job migration, backend, Admin và Restaurant. Job migration phải hoàn tất trước khi backend healthy.

### Backend hot reload trong Docker

Dùng override local khi muốn mount source backend và Prisma vào container:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up backend
```

Chế độ này dành cho vòng lặp phát triển, không dùng làm bằng chứng release.

## Health check

Kiểm tra trạng thái container trước:

```powershell
docker compose ps
```

Sau đó xác minh endpoint:

```powershell
Invoke-WebRequest http://[::1]:3001/api/healthz
Invoke-WebRequest http://[::1]:3000/api/healthz
Invoke-WebRequest http://[::1]:3002/api/healthz
```

Dùng URL loopback `[::1]` rõ ràng cho E2E nếu một app local khác đang chiếm `127.0.0.1:3000`. CORS mặc định của backend đã bao gồm cả localhost và origin `[::1]` cho môi trường phát triển.

## Vòng đời dữ liệu

- Volume compose giữ PostgreSQL, Redis và MinIO giữa các lần restart.
- `docker compose down` dừng stack nhưng không xoá dữ liệu.
- `docker compose down -v` xoá database, Redis và MinIO local. Chỉ dùng khi chủ động reset sạch local.
- Migration production phải theo deployment guide và dùng secret manager production, không dùng default local compose.

## Release gate local

Chạy gate tương ứng với phần đã đụng. Trước deploy, toàn bộ gate phải xanh:

```powershell
cd backend
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

```powershell
cd web
pnpm install --frozen-lockfile
pnpm --filter foodflow-admin typecheck
pnpm --filter foodflow-admin lint
pnpm --filter foodflow-admin test
pnpm --filter foodflow-admin build
pnpm --filter foodflow-restaurant typecheck
pnpm --filter foodflow-restaurant lint
pnpm --filter foodflow-restaurant test
pnpm --filter foodflow-restaurant build
pnpm test:e2e --project=chromium --project=firefox
```

```powershell
cd mobile
flutter analyze
flutter test
```

Playwright phải bao phủ Chromium và Firefox, smoke accessibility axe serious/critical, visual contract và tenant isolation.

## Guardrail production

- JWT, MinIO và database trong dev compose chỉ dùng local.
- Không bật `FOODFLOW_ENABLE_DEV_API_REWRITE` trên Vercel.
- Không deploy khi GitHub Actions đang lỗi auth, billing hoặc token; sau khi khôi phục quyền truy cập phải chạy lại remote CI.
- Chỉ deploy Supabase và Vercel sau khi local gate, secret scan, frozen install và production secret đều đã hợp lệ.
- Sau deploy phải xác minh backend health, web health, realtime order, map, chatbot, export, notification, tenant isolation và mobile API connectivity.

## Xử lý sự cố

- Nếu container distroless web hoặc backend báo unhealthy, xem `docker compose logs <service>` và kiểm tra healthcheck vẫn dùng đúng đường dẫn Node runtime được bundle.
- Nếu Admin gọi sai API, rebuild với `NEXT_PUBLIC_API_URL` đúng vì đây là giá trị build-time.
- Nếu map không render local, kiểm tra browser map key trong env web và referrer restriction trên Google Cloud.
- Nếu map hoặc chatbot production lỗi vì key đã lộ, rotate key trước; không dùng lại credential đã lộ.
- Nếu remote CI không chạy được vì GitHub Actions hết quyền/token/billing, tiếp tục làm local và ghi lại bằng chứng gate local gần nhất cho tới khi chạy lại được remote check.
