# Changelog

## [0.1.0] — 2026-06-04

### Added
- Backend API với NestJS, Prisma, PostgreSQL+PostGIS, Redis, BullMQ, Socket.IO
- Authentication (JWT + refresh rotation + RBAC 4 roles)
- Tìm nhà hàng gần (PostGIS ST_DWithin)
- Quản lý menu (categories, items, options)
- Giỏ hàng + đặt món + thanh toán (mock)
- Order state machine (14 trạng thái)
- Driver dispatch (Redis GEOSEARCH + SETNX lock + 30s timeout + retry)
- Realtime GPS tracking (WebSocket + throttled broadcast + PostGIS batch)
- Driver online/offline + earnings
- Admin dashboard (KPI, charts, order/user/restaurant management, support kanban)
- Restaurant dashboard (live order queue, menu CRUD, revenue)
- Customer mobile app (Flutter, 14 screens)
- Driver mobile app (Flutter, 12 screens, dark theme)
- AI Assistant (legacy workflow implementation, replaced by the direct LLM runtime in Batch 4)
- Docker Compose infrastructure for the application, data stores, queues, and observability
- CI/CD (GitHub Actions)
- Monitoring (Prometheus + Grafana + Redis Exporter)
- Nginx reverse proxy với WebSocket support
- Seed data (basic + big seed)

### Security
- JWT access + refresh token rotation
- RBAC guards trên tất cả endpoints
- Rate limiting (global + per-route)
- Helmet security headers
- Input validation (Zod/class-validator)
- CORS cấu hình động
- WebSocket origin restriction
- Redis-backed refresh token blocklist

### DevOps
- Multi-stage Dockerfile (non-root user, healthcheck)
- docker-compose.yml (production) + docker-compose.local.yml (development)
- Redis persistence (AOF + RDB hybrid)
- Socket.IO Redis adapter cho horizontal scaling
- BullMQ worker tách riêng process (2 replicas)
- Bull Board queue monitoring
- PostgreSQL + PostGIS healthcheck
- json-file logging với rotation
- Resource limits trên tất cả services
