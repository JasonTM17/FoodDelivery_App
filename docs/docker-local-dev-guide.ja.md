# Docker とローカル開発ガイド

このガイドは FoodFlow Batch 4 のローカル実行手順をまとめたものです。Docker のローカル既定値は開発専用なので、production の secret manager にコピーしないでください。

## 前提条件

- Docker Desktop または Docker Engine と Compose v2
- ホストで backend または web を実行する場合は Node.js 20+ と pnpm
- mobile を検証する場合は Flutter stable
- リリースゲートを確認する場合は clean worktree

## 環境変数と secret のルール

ホストからコマンドを実行する場合は、example ファイルを ignore 済みの local env にコピーします。

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item web/apps/admin/.env.example web/apps/admin/.env.local
Copy-Item web/apps/restaurant/.env.example web/apps/restaurant/.env.local
```

Production credentials は Supabase、Vercel、または backend host の secret manager に保存します。`.env`、CLI auth ファイル、storage state、private certificate、database dump、provider token は commit しないでください。チャットやログに貼られた AI key または map key は漏えい済みとして扱い、production 前に rotate してください。

## ローカル実行モード

### インフラのみ

Backend、web、mobile をホストから実行し、PostgreSQL/PostGIS、Redis、MinIO だけを container で動かす場合に使います。

```powershell
docker compose up -d postgres redis minio
```

その後、各 app のコマンドをホストから実行します。

```powershell
cd backend
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
pnpm start:dev
```

### Full standalone stack

ブラウザ E2E と release に近いローカル検証で使います。Web Dockerfile は build 時に `NEXT_PUBLIC_API_URL` を埋め込むため、image を rebuild する前に設定してください。

```powershell
$env:NEXT_PUBLIC_API_URL = "http://[::1]:3001/api"
$env:CORS_ORIGINS = "http://localhost:3000,http://localhost:3002,http://localhost:3003,http://[::1]:3000,http://[::1]:3002,http://[::1]:3003"
docker compose up -d --build backend admin restaurant
```

Compose は PostgreSQL/PostGIS、Redis、MinIO、migration job、backend、Admin、Restaurant を起動します。Backend が healthy になる前に migration job が完了している必要があります。

### Docker 内 backend hot reload

Backend source と Prisma files を container に mount したい場合は local override を使います。

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up backend
```

このモードは開発フィードバック用であり、release evidence には使いません。

## Health check

まず container 状態を確認します。

```powershell
docker compose ps
```

次に endpoint を確認します。

```powershell
Invoke-WebRequest http://[::1]:3001/api/healthz
Invoke-WebRequest http://[::1]:3000/api/healthz
Invoke-WebRequest http://[::1]:3002/api/healthz
```

別の local app が `127.0.0.1:3000` を使っている場合は、E2E で明示的に `[::1]` loopback URL を使います。Backend の CORS 既定値には development 用の localhost と `[::1]` origin が含まれています。

## データのライフサイクル

- Compose volumes は PostgreSQL、Redis、MinIO のデータを restart 後も保持します。
- `docker compose down` は stack を停止しますが、データは削除しません。
- `docker compose down -v` は local database、Redis、MinIO data を削除します。local reset を意図するときだけ使ってください。
- Production migrations は deployment guide と production secret manager の値を使い、local compose defaults は使いません。

## ローカル release gate

変更した領域に対応する gate を実行します。Deploy 前には全 gate が green である必要があります。

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
pnpm --filter restaurant typecheck
pnpm --filter restaurant lint
pnpm --filter restaurant test
pnpm --filter restaurant build
pnpm test:e2e --project=chromium --project=firefox
```

```powershell
cd mobile
flutter analyze
flutter test
```

Playwright は Chromium と Firefox、axe serious/critical accessibility smoke、visual contract、tenant isolation を確認する必要があります。

## Production guardrails

- Dev compose の JWT、MinIO、database values は local 専用です。
- Vercel では `FOODFLOW_ENABLE_DEV_API_REWRITE` を有効にしないでください。
- GitHub Actions の auth、billing、token が無効な間は deploy しません。復旧後に remote CI を再実行してください。
- Supabase と Vercel は local gates、secret scans、frozen installs、production secrets を確認してから deploy します。
- Deploy 後は backend health、web health、realtime orders、maps、chatbot、exports、notifications、tenant isolation、mobile API connectivity を確認します。

## Troubleshooting

- Distroless web または backend container が unhealthy の場合は `docker compose logs <service>` を確認し、healthcheck が bundled Node runtime path を使っていることを確認します。
- Admin が誤った API を呼ぶ場合は、正しい `NEXT_PUBLIC_API_URL` で rebuild します。この値は build-time value です。
- Local maps が表示されない場合は、web env の browser map key と Google Cloud の referrer restrictions を確認します。
- Production maps または chatbot が leaked key で失敗した場合は、key を rotate してから進めます。
- GitHub Actions access が token/billing/auth の問題で使えない場合は、local work を継続し、remote checks を再実行できるまで最新の local gate evidence を記録します。
