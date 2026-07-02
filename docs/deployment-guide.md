# FoodFlow Deployment Guide

## Local Development

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
cd backend && pnpm install && pnpm prisma generate && pnpm prisma migrate dev && pnpm db:seed && pnpm start:dev
cd web && pnpm install && pnpm dev
cd mobile && flutter pub get && flutter run
```

## VPS Deployment (Coolify/Dokploy)

1. Point domain to VPS IP
2. Clone repo, copy .env.example to .env with production values
3. Generate strong secrets: `openssl rand -hex 64` for JWT_SECRET, N8N_ENCRYPTION_KEY
4. `docker compose up -d`
5. Set up SSL via Nginx + Let's Encrypt

## Environment Variables

All required vars documented in `.env.example`. Production must override:
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — 64-char hex
- `N8N_ENCRYPTION_KEY` — used to encrypt N8N credentials
- `MINIO_SECRET_KEY` — min 8 chars
- `POSTGRES_PASSWORD` — strong password
- `GOOGLE_MAPS_API_KEY` — Google Cloud Console
- `DEEPSEEK_API_KEY` — DeepSeek chatbot provider key; keep only in the deployment secret store
- `DEEPSEEK_MODEL` — default `deepseek-v4-flash` unless the provider contract changes
- `GEMINI_API_KEY` — Google AI Studio for legacy N8N/Gemini workflows

## Docker Hub

Images pushed automatically on push to main:
```bash
docker pull nguyenson1710/foodflow-backend:latest
```

## Monitoring

- Grafana: http://localhost:3100 (admin / foodflow_admin)
- Prometheus: http://localhost:9090
- Bull Board: http://localhost:3080
- N8N: http://localhost:5678
