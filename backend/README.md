# FoodFlow — Hướng dẫn chạy local

## Yêu cầu

- Docker Desktop
- Node.js 20+ + pnpm 10
- Flutter 3.x (cho mobile)

## 1. Khởi động Backend + Database

```bash
# Copy env
cp .env.example .env

# Khởi động tất cả services
docker compose up -d

# Chạy migration + seed
cd backend
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm db:seed

# Start dev server
pnpm start:dev
```

Backend chạy tại http://localhost:3001/api

## 2. N8N AI Assistant

N8N chạy tại http://localhost:5678

1. Mở N8N UI → Settings → Import
2. Import từng file trong `infra/n8n/workflows/`
3. Cấu hình credential (Gemini API key, Backend API key)
4. Activate workflows

## 3. Web Dashboard

```bash
cd web
pnpm install
pnpm dev
```

- Admin Dashboard: http://localhost:3002
- Restaurant Dashboard: http://localhost:3003

## 4. Mobile App

```bash
cd mobile
flutter pub get
flutter run -t lib/main_customer.dart  # Customer App
flutter run -t lib/main_driver.dart     # Driver App
```

## Tài khoản test (sau khi seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@foodflow.vn | Admin@123 |
| Customer | customer1@foodflow.vn | Customer@123 |
| Driver | driver1@foodflow.vn | Driver@123 |
| Restaurant | restaurant1@foodflow.vn | Partner@123 |

## API Docs

Swagger UI: http://localhost:3001/api/docs
