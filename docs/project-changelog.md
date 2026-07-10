# FoodFlow Project Changelog

This file records release-level, user-relevant changes. The Git history is the
authoritative source for individual commits and implementation detail.

## Unreleased

### Changed

- Refreshed release, deployment, Docker, security, API, testing, architecture,
  branch, and roadmap documentation for the Node 22, pnpm 11.11, and Next.js 15
  runtime.
- Defined Supabase as the managed database, Realtime, and Storage provider, and
  Vercel as the managed API/Admin/Restaurant host.
- Kept Socket.IO, Redis, MinIO, and BullMQ as local or self-hosted compatibility
  providers rather than presenting them as the managed-production path.
- Documented immutable Docker release and SHA tags, multi-architecture scans,
  and manual post-smoke promotion of latest.
- Added current-source product screenshots and optimized Admin/Restaurant GIF
  flows with capture provenance. They are not production media.

### Fixed

- Hardened GPS/ETA processing so stale buffered locations and planned geometry
  do not masquerade as live delivery movement.
- Removed runtime hard-coded i18n fallbacks and added locale routing/error-state
  hardening for the web workspaces.
- Replaced fake-empty business responses with explicit unavailable/error paths
  in affected incentives, referral, and AI flows.
- Registered the AI module and documented fail-closed provider behavior and
  real telemetry requirements.
- Added tenant-scoped Supabase realtime token, outbox, RLS, and job-drain
  contracts to the public API documentation.

### Release blockers

- Production secrets, Supabase CLI migration credentials, and Vercel production
  environment variables still require secure configuration.
- Mobile must migrate from its Socket.IO compatibility client to the same
  Supabase token/channel contract before a production mobile release.
- Full current-head local, remote CI, accessibility, visual, tenant, map, AI,
  and production smoke gates remain mandatory before deployment.

## 0.2.0 - 2026-06-07

### Added

- Vietnamese, English, and Japanese foundations across backend, web, and mobile.
- Payments, audit/review, dispatch, loyalty, wallet, referral, promotions, and
  Admin/Restaurant portal feature work.
- Flutter customer/driver flows, driver GPS controls, and merchant management
  screens.
- Docker Compose, observability resources, API contracts, Playwright helpers,
  and quality-gate foundations.

### Changed

- Shared web UI gained common page-header and breadcrumb patterns.
- Notifications and background jobs began carrying locale explicitly.

## 0.1.0 - 2026-05-01

### Added

- JWT/RBAC authentication, restaurant search with PostGIS, menu/cart/order
  lifecycle, driver dispatch, tracking, and administrative dashboards.
- Flutter customer and driver applications plus Admin and Restaurant Next.js
  applications.
- Initial AI-support, Docker Compose, MinIO, and observability foundations.
