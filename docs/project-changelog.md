# FoodFlow Project Changelog

This file records release-level, user-relevant changes. The Git history is the
authoritative source for individual commits and implementation detail.

## Unreleased

### Changed

- Added a standalone Customer guide in English, Vietnamese, and Japanese, with
  prominent README/gallery navigation, a quick-start checklist, map-based
  delivery-address selection, checkout and tracking guidance, troubleshooting,
  and explicit visual/release boundaries.
- Refreshed release, deployment, Docker, security, API, testing, architecture,
  branch, and roadmap documentation for the Node 22, pnpm 11.11, and Next.js 15
  runtime.
- Defined Supabase as the managed database, Realtime, and Storage provider;
  Railway as the managed API/worker/migrator/Redis host; and Vercel as the
  Admin/Restaurant host.
- Added a localized product overview/PDR and synchronized architecture,
  deployment, testing, accessibility, and release-boundary documentation with
  the current hardening work.
- Kept Socket.IO, Redis, MinIO, and BullMQ as local or self-hosted compatibility
  providers rather than presenting them as the managed-production path.
- Documented immutable Docker release and SHA tags, multi-architecture scans,
  and manual post-smoke promotion of latest.
- Retained historical product screenshots and optimized Admin/Restaurant GIF flows.
  Their manifest lacks a source SHA/image reference, so recapture with source/runtime
  provenance is required before they support a current-release claim.
- Made Customer and Driver product coverage explicit in the product gallery and
  documented the boundary between web captures and device/emulator evidence.

### Fixed

- Serialized default-address replacement on the user row, enforced at most one
  default address per user with a partial unique index, and aligned the database
  UUID default with Prisma. A fresh database applied all 38 migrations and the
  duplicate-default probe was rejected as expected.
- Required a valid map selection when Customer creates a delivery address,
  prevented duplicate submissions while saving, fixed the compact promotion
  carousel overflow, and skipped redundant KYC onboarding for verified drivers.
- Hardened GPS/ETA processing so stale buffered locations and planned geometry
  do not masquerade as live delivery movement.
- Removed runtime hard-coded i18n fallbacks and added locale routing/error-state
  hardening for the web workspaces.
- Replaced fake-empty business responses with explicit unavailable/error paths
  in affected incentives, referral, and AI flows.
- Registered the AI module and documented fail-closed provider behavior and
  real telemetry requirements.
- Added tenant-scoped Supabase realtime token/private-Broadcast authorization
  and durable PostgreSQL job-outbox drain contracts to the public API documentation.
- Migrated managed mobile realtime to scoped Supabase private-Broadcast subscriptions while
  keeping GPS and dispatch decisions on authenticated REST; Socket.IO remains
  an explicit local/self-hosted provider.
- Replaced legacy public-URL driver KYC with private owner-scoped signed
  uploads, object/signature validation, atomic review state, signed Admin
  previews, and typed vi/en/ja mobile onboarding.
- Replaced legacy FCM server-key transport with Firebase Admin SDK/HTTP v1,
  retryable provider failures, permanent-token stale marking, and documented
  secret-managed/ADC credentials.
- Added authenticated Flutter FCM token registration, rotation, and bounded
  logout cleanup for Customer and Driver; token input now has an explicit API
  schema and the mobile build/setup contract is documented.
- Hardened FCM cleanup with registration UUIDs, per-token PostgreSQL advisory
  locks, and seven-day revocation tombstones; foreground/terminated taps now
  use only validated local deep links, and FCM tokens no longer appear in URLs.
- Made Driver availability and session cleanup race-safe, localized login
  errors, removed duplicate initial dashboard loading, and corrected dark
  operational text semantics.
- Rebuilt Restaurant navigation as a responsive accessible sidebar/drawer with
  skip navigation, visible focus, locale-preserving controls, and reduced
  motion behavior.

### Release blockers

- The dated 2026-07-14 external preflight record reports Supabase migrations and
  Vercel public production variables configured; Railway still needs real
  third-party provider credentials before a fresh rollout check.
- Final Android production signing and iOS build/signing evidence still require
  authorized release credentials/runners; local debug APKs are not publishable.
- Full current-head local, remote CI, accessibility, visual, tenant, map, AI,
  and production smoke gates remain mandatory before deployment.
- At local `eb598c7b7da40f122901a866e35050f3a2e98c1c`, a fresh clean-volume
  Docker stack completed 36 migrations, seeded 201 users / 50 restaurants /
  352 menu items / 509 orders / 123 reviews, indexed 402 RAG documents, and
  reported Playwright 204 expected / 0 unexpected / 0 flaky / 0 skipped across
  Chromium, Firefox, and Pixel 5 in 353316 ms. This is local evidence only; a
  fresh authorized remote CI run and provider checks are still required. Live
  FCM delivery remains unverified until operator credentials and a controlled
  device token produce redacted evidence.

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
