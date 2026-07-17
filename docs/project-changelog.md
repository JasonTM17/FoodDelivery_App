# FoodFlow Project Changelog

This file records release-level, user-relevant changes. The Git history is the
authoritative source for individual commits and implementation detail.

## Unreleased

### Changed

- Rotated the Supabase database credential, deployed all six Railway database
  URL changes, reran the 42/42 migration checksum audit, and reverified API,
  worker, Redis, database, and Supabase Storage health without committing a
  credential value.
- Rebuilt both Vercel production applications with exact revision metadata and
  hardened the deploy helper so a web rollout requires the same clean remote
  SHA from Railway API health first.
- Verified that Docker Hub and public GHCR expose backend, migrate, admin, and
  restaurant packages; the worker intentionally reuses the backend image.

- Published immutable multi-architecture Docker SHA images for
  `84eeac3a2845868fc3a7fd45f8a73775e834a09d`, rolled the same backend digest
  through Railway API/worker, completed the one-off migrator, and rebuilt the
  Admin Vercel production deployment.
- Added a fail-closed Vercel production deploy helper that requires a clean
  `origin/master`, injects the immutable SHA into build/runtime metadata, and
  rejects a deployment whose public health revision does not match.
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
  exact deployed-revision checks, the required two-pass SHA/semver promotion
  sequence, and manual post-smoke promotion of latest.
- Retained historical product screenshots and optimized Admin/Restaurant GIF flows.
  Their manifest lacks a source SHA/image reference, so recapture with source/runtime
  provenance is required before they support a current-release claim.
- Made Customer and Driver product coverage explicit in the product gallery and
  documented the boundary between web captures and device/emulator evidence.
- Added privacy-reviewed authenticated Customer Home, Orders, and Profile stills
  plus a three-frame role GIF from synthetic local fixtures. The inventory now
  records four Customer WebPs and two GIFs, with no credential, exact coordinate,
  contact detail, production account, or release-certification claim.
- Added a privacy-reviewed four-frame Driver role GIF from the existing Android
  stills and kept its local/production-emulator evidence boundaries explicit.
- Recorded the successful Railway API/worker deployments, the corrected public
  domain port, Supabase Storage readiness, and the remaining production-smoke
  boundary without relabeling infrastructure health as release approval.

### Fixed

- Restored the exact production Storage migration bytes from dangling Git blob
  `c29c069ea180ed6c3107411759b8ceb2150dc8e7`, added a checksum regression test,
  and returned the production migration audit to `42/42` passing records.
- Serialized default-address replacement on the user row, enforced at most one
  default address per user with a partial unique index, and aligned the database
  UUID default with Prisma. A fresh database applied all 38 migrations and the
  duplicate-default probe was rejected as expected.
- Required a valid map selection when Customer creates a delivery address,
  prevented duplicate submissions while saving, fixed the compact promotion
  carousel overflow, and skipped redundant KYC onboarding for verified drivers.
- Localized all 15 backend order statuses in Customer badges for English,
  Vietnamese, and Japanese. `restaurant_pending` now renders as `Chờ nhà hàng`
  in the retained Vietnamese capture instead of exposing the raw enum; unknown
  future statuses use a localized safe fallback, backed by focused mapping and
  widget tests. Customer history now consistently groups `delivered` and
  `completed` as completed, and `cancelled` and `refunded` as cancelled; the
  supported non-cancelled lifecycle maps across four tracking phases. Focused
  grouping and provider-contract tests protect these boundaries.
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
- Hardened Driver terminal realtime cleanup for `completed`, `cancelled`, and
  `refunded`: active/background order state now clears immediately, order-status
  and ETA subscriptions are cancelled, and the order channel is unsubscribed.
  Completed-stat refresh preserves a newly assigned order; a parameterized
  realtime regression covers representatives of both terminal status groups.
- Rebuilt Restaurant navigation as a responsive accessible sidebar/drawer with
  skip navigation, visible focus, locale-preserving controls, and reduced
  motion behavior.
- Kept optional third-party providers from blocking API/worker startup while
  preserving fail-closed feature behavior. Missing Google/owned OSRM now gives
  `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED`; production RAG stays disabled
  without a DeepSeek credential.
- Added immutable build revisions to API/Admin/Restaurant health responses,
  made authenticated production smoke fail closed by default, and removed
  tag-triggered release publication in favor of protected manual promotion.
- Added GiST indexes for restaurant-nearby and driver-location PostGIS query
  paths, kept separately recoverable from the fail-closed empty legacy Storage
  bucket cleanup.

### Release blockers

- Railway migrator `5e52c611-60d4-4c4a-a109-83d44eec21f0`, API
  `8b8c3450-a5a7-4138-b030-c4c2b072702b`, worker
  `ff50c82f-5471-4be9-b4fc-899e559a3efc`, and both Vercel apps run the exact
  immutable `f2c02ed` revision. Health/readiness return 200 and worker outbox
  polling is active. This closes the revision-split blocker only.
- Final Android production signing and iOS build/signing evidence still require
  authorized release credentials/runners; local debug APKs are not publishable.
- Authenticated browser role flows, controlled-device FCM,
  configured FCM/SMTP/Twilio/SePay/DeepSeek/owned-route
  checks, accessibility, visual, tenant, device, and image-pull gates remain
  mandatory before release certification.
- Recovered exact production Realtime and Job migration bytes from immutable
  migrator image revision `1f761a65`; the approved checksum entries accept only
  those reviewed bytes while each reviewed local checksum remains unchanged.
  Production Storage checksum
  `4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6`
  remains the sole provenance blocker because it was absent from all Git objects
  and inspected registry images. The read-only audit names only that migration
  and remains fail-closed; schema end-state and `prisma migrate resolve` are not
  substitutes for original SQL provenance. All 42 source migrations are active;
  the unresolved checksum blocks every future migrator rollout.
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
