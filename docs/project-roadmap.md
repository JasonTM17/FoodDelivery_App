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

### Batch 4 Web/Backend Parity
- [x] RFC 7807 error formatting for web/admin/restaurant API clients
- [x] AI chat module registered in the backend runtime path
- [x] Restaurant menu/cart/order body validation scoped to request bodies
- [x] Customer address lookup supports real cart-to-order E2E checkout
- [x] Admin order detail payload flattened for Next.js detail routes
- [x] Chromium and Firefox Playwright coverage for localized real order flows
- [ ] Full axe serious/critical scan across Batch 4 pages
- [ ] Visual regression against approved Stitch screens
- [ ] Supabase/Vercel deployment validation after all local gates pass

### Auth + Security
- [ ] JWT upgrade: HS256 → Ed25519 + JWKS — phase 1 dual-verify IN PROGRESS
- [ ] Web Dockerfiles for admin + restaurant portals (P1-1 from audit)
- [ ] ADR documentation sweep: ADR-0001 through ADR-0005+ (P1-2 from audit)
- [ ] Per-service README completion — auth/orders/dispatch/payments/tracking/notifications/reviews/ai/chat (P1-3 from audit)

### Features (stubs shipped in batch-3, full impl pending)
- [ ] Loyalty points system — full earn/redeem logic, expiry, tier rules
- [ ] Wallet balance — top-up, withdrawal, transaction history pagination
- [ ] Referral codes — reward crediting on redemption, conversion tracking
- [ ] Driver incentives — real DB-backed streaks + bonus calculation
- [ ] Admin dispatch heatmap + restaurant KPI — real query from order/dispatch tables

### Mobile + Integrations
- [ ] Push notifications — FCM (Android) + APNs (iOS) via n8n
- [ ] Google Maps Directions API routing for driver ETA
- [ ] Background GPS tracking (flutter_background_service, replaces geolocator foreground stream)
- [ ] n8n system-prompt wire + /ai/chat/eval endpoint (P2-4, P2-5 from audit)
- [ ] NSFW filter for review photos (TensorFlow Lite or Cloud Vision API)

### Customer UX
- [ ] Customer favorite restaurants
- [ ] Order re-ordering from history

### Infrastructure
- [ ] Redis Cluster for real-time at scale
- [ ] Database read replicas
- [ ] CDN for food images (CloudFront or BunnyCDN)
- [ ] Kubernetes deployment (Helm charts)
- [ ] Automated database backups (pg_dump → S3 daily)
- [ ] Human-reviewed ja locale translations
- [ ] dayjs ESM Jest config fix (`transformIgnorePatterns`) (P2-3 from audit)

## v1.0 — Scale

- [ ] Machine learning ETA prediction
- [ ] Batch dispatch (group orders)
- [ ] Multi-city support
- [ ] Surge pricing engine
- [ ] Restaurant analytics dashboard
- [ ] Driver heatmap + demand prediction
