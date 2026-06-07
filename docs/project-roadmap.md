# FoodFlow Project Roadmap

## v0.1 — MVP (Complete)

- [x] Auth with JWT + RBAC
- [x] Restaurant nearby search (PostGIS)
- [x] Menu management CRUD
- [x] Cart + order placement
- [x] Order state machine (14 states)
- [x] Driver dispatch (Redis GEO)
- [x] Real-time GPS tracking (WebSocket)
- [x] Admin dashboard
- [x] Restaurant dashboard
- [x] Customer mobile app (Flutter)
- [x] Driver mobile app (Flutter)
- [x] AI assistant (N8N + Gemini)
- [x] Docker Compose + monitoring

## v0.2 — Beta (Complete)

- [x] Real payment integration (SePay with HMAC webhook verification)
- [x] Commission split processor (platform 15%, restaurant 70%, driver 15%)
- [x] Reviews aggregation + moderation + photo upload + reply thread
- [x] i18n — vi/en/ja across backend (nestjs-i18n), mobile (flutter_localizations), web (next-intl)
- [x] User.preferredLocale persisted + locale propagated through BullMQ jobs
- [x] Driver real GPS online toggle + dispatch offer dialog
- [x] Driver KYC document upload (MinIO presigned URLs)
- [x] Admin audit logs with filters, pagination, CSV export
- [x] Admin vocabulary sweep + PageHeader shared component
- [x] Restaurant profile image upload + reviews/notifications wired to real API
- [x] CI integration smoke gate (4 parallel jobs)
- [x] Lighthouse CI config + k6 load test (100 RPS × 5 min)
- [ ] Push notifications (FCM/APNs) — deferred to v0.3
- [ ] Google Maps Directions API routing — deferred to v0.3
- [ ] Customer favorite restaurants — deferred to v0.3
- [ ] Order re-ordering from history — deferred to v0.3

## v0.3 — Production

- [ ] JWT upgrade: HS256 → Ed25519 + JWKS (ADR pending)
- [ ] Push notifications — FCM (Android) + APNs (iOS) via n8n
- [ ] Google Maps Directions API routing for driver ETA
- [ ] Customer favorite restaurants
- [ ] Order re-ordering from history
- [ ] Redis Cluster for real-time at scale
- [ ] Database read replicas
- [ ] CDN for food images (CloudFront or BunnyCDN)
- [ ] Kubernetes deployment (Helm charts)
- [ ] Automated database backups (pg_dump → S3 daily)
- [ ] Human-reviewed ja locale translations

## v1.0 — Scale

- [ ] Machine learning ETA prediction
- [ ] Batch dispatch (group orders)
- [ ] Multi-city support
- [ ] Surge pricing engine
- [ ] Restaurant analytics dashboard
- [ ] Driver heatmap + demand prediction
