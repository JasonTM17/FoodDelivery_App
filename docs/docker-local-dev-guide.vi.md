# Hướng dẫn Docker và phát triển local

## Phạm vi

Tài liệu này dành cho local development, isolated E2E, kiểm tra container và self-hosted compatibility. Managed production dùng Supabase cho PostgreSQL/PostGIS, Realtime, Storage; Railway cho API, worker, migrator, Redis; và Vercel cho Admin/Restaurant. Xem [deployment guide](deployment-guide.vi.md).

Yêu cầu: Docker Compose v2/Buildx, Node.js 22.13+, Corepack pnpm 11.11.0, Flutter SDK; FFmpeg chỉ cần khi tạo GIF.

## Env và secret

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item web/apps/admin/.env.example web/apps/admin/.env.local
Copy-Item web/apps/restaurant/.env.example web/apps/restaurant/.env.local
```

Chỉ tạo file bị ignore. Không commit dotenv thật, auth CLI, dump, certificate, token hoặc signing material. Key từng xuất hiện trong chat/log phải rotate. Default `foodflow_dev`, `minioadmin` và JWT development bị cấm trong production.

Local dùng explicit Socket.IO + Redis/BullMQ + MinIO; managed production dùng explicit Supabase Realtime/Storage/Postgres queue, Railway API/worker/migrator/Redis và Vercel dashboard.

## Hạ tầng container, app chạy host

```powershell
docker compose up -d postgres redis minio

cd backend
corepack pnpm install --frozen-lockfile
corepack pnpm prisma generate
corepack pnpm prisma migrate dev
corepack pnpm db:seed
corepack pnpm start:dev
```

Web: `cd web; corepack pnpm install --frozen-lockfile; corepack pnpm dev`.

Mobile: `flutter pub get --enforce-lockfile`, sau đó chạy `lib/main_customer.dart` hoặc `lib/main_driver.dart`.

## Full local stack

```powershell
docker compose up -d --build
docker compose ps
```

Migration container phải exit `0` trước khi API healthy. `NEXT_PUBLIC_*` được bake lúc build nên đổi value phải rebuild web image.

Health: API `localhost:3001/api/healthz`, Admin `localhost:3000/api/healthz`, Restaurant `localhost:3002/api/healthz`.

## Isolated Batch 4 stack

Không đụng root stack:

```powershell
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
```

Port: Admin `13000`, API `13001`, Restaurant `13002`, Postgres `15432`, Redis `16379`, MinIO `19000/19001`.

Origin CORS được cấu hình cho `localhost`; dùng `127.0.0.1` sẽ cố ý rơi vào error state. Seed test từ host:

```powershell
$env:DATABASE_URL='postgresql://foodflow:foodflow_dev@localhost:15432/foodflow'
$env:DIRECT_URL=$env:DATABASE_URL
cd backend
corepack pnpm db:seed      # fixture nhỏ
corepack pnpm db:big-seed  # dashboard/E2E rộng khi cần
cd ..
Remove-Item Env:DATABASE_URL,Env:DIRECT_URL
```

Seed deterministic chỉ là test fixture và bị chặn trong production; không phải runtime fallback data.

## Hot reload backend

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up backend
```

Mode này mount source và không phải release evidence.

## Docker artifact

| Artifact | Dockerfile/target |
|---|---|
| Backend | `backend/Dockerfile` → `runner` |
| Migrate | `backend/Dockerfile` → `migrator` |
| Admin | `web/apps/admin/Dockerfile` |
| Restaurant | `web/apps/restaurant/Dockerfile` |

Không còn generic `web/Dockerfile`; worker chạy `dist/workers/main.js` từ backend image. Final image là distroless non-root, hỗ trợ `linux/amd64` và `linux/arm64`. Workflow smoke bcrypt/BullMQ/MessagePack, Prisma, Sharp, UID, manifest/SBOM và Trivy cho cả hai kiến trúc.

## Release gate local

```powershell
powershell -File infra/scripts/local-release-gate.ps1 -RunE2E
```

Partial run chỉ dùng trong development và phải ghi rõ partial:

```powershell
powershell -File infra/scripts/local-release-gate.ps1 \
  -AllowDirty -SkipInstall -SkipBuild -SkipDeployPreflight
```

Partial không được approve release.

## Tạo screenshot/GIF

Khi isolated stack đã healthy và seed:

```powershell
$env:FOODFLOW_ADMIN_URL='http://localhost:13000'
$env:FOODFLOW_RESTAURANT_URL='http://localhost:13002'
$env:FOODFLOW_API_URL='http://localhost:13001/api'
node docs/scripts/capture-product-media.mjs
Remove-Item Env:FOODFLOW_ADMIN_URL,Env:FOODFLOW_RESTAURANT_URL,Env:FOODFLOW_API_URL
```

Script dùng API thật, tối ưu palette GIF và xóa frame trung gian. Vẫn phải xem từng ảnh vì exit code xanh có thể chỉ chụp error state.

## Data và self-hosted

- `docker compose down` giữ volume; `down -v` xóa dữ liệu local và chỉ dùng sau khi xác nhận đúng compose project.
- Không cleanup toàn bộ container/volume trên máy dùng chung.
- Self-hosted phải pin `IMAGE_TAG=v4.0.0` hoặc `sha-<full-commit>`, điền `.env.production` thật và dùng base + `docker-compose.prod.yml`; trước `up` chạy `pull --ignore-buildable`, rồi `build postgres`. `postgres` PostGIS + pgvector là hạ tầng build-only local, không phải release image đã publish.
- Self-hosted Socket.IO/Redis/MinIO không phải fallback cho Supabase/Railway/Vercel cấu hình sai.

## Xử lý sự cố

- Sai API/CORS: kiểm tra `NEXT_PUBLIC_API_URL` bake trong image và origin `localhost`/`127.0.0.1`.
- Migration fail: xem log `migrate`, không bypass dependency.
- Sharp/native fail: không trộn Alpine/musl build với Debian/glibc runtime.
- Redis: BullMQ cần `maxmemory-policy noeviction`.
- Map: dùng key bị giới hạn và telemetry thật, không thêm hardcoded coordinate.
- AI: thêm key rotate qua secret manager, không bịa fallback LLM.
- CI hết hạn: được tiếp tục local có evidence nhưng không deploy/merge/publish cho tới khi CI khôi phục.
