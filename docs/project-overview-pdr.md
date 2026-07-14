# FoodFlow Project Overview and Product Requirements

Languages: [English](./project-overview-pdr.md) | [Tiếng Việt](./project-overview-pdr.vi.md) | [日本語](./project-overview-pdr.ja.md)

## Product intent

FoodFlow helps customers order food, restaurants operate orders and menus, drivers complete assigned deliveries, and administrators operate the marketplace. The product is multi-tenant: restaurant staff, realtime events, tracking, exports, and administrative actions must remain scoped to the authorized actor.

## Surfaces and ownership

| Surface | Primary users | Responsibility |
|---|---|---|
| NestJS API and worker | All clients; operations | Auth, RBAC, tenant checks, durable jobs, integrations, audit records |
| Admin dashboard | Marketplace operators | KPIs, support, review, audit, drivers, users, restaurant operations |
| Restaurant dashboard | Restaurant staff | Orders, menu, staff, promotions, revenue, reviews, opening hours |
| Customer app | Customers | Browse, cart, checkout, order tracking, support |
| Driver app | Drivers | Verified onboarding, GPS-backed availability, dispatch, delivery status, earnings |

Managed production uses Supabase for PostgreSQL/PostGIS, Realtime, and Storage; Railway for the API, worker, migrator, and Redis; and Vercel for Admin and Restaurant. Docker Compose is a separate local/self-hosted compatibility topology.

## Functional requirements

- Orders, payments, dispatch, notifications, exports, and audit data use real persisted state. A missing provider or unavailable data returns a clear error/degraded state; it never becomes fabricated success.
- API authorization applies identity, role, and tenant/ownership checks at the protected operation. Realtime channel claims are short-lived and private.
- Driver availability is GPS-backed. The client may show paused/offline only after the canonical availability command has succeeded; logout cancels active subscriptions so a prior session cannot update a later session.
- Notifications are durable jobs. FCM uses Firebase Admin SDK/HTTP v1 with `FCM_PROJECT_ID` and either workload credentials/ADC or a secret-managed `FCM_SERVICE_ACCOUNT_JSON`; provider-request failure is retried and permanently invalid tokens are marked stale. Mobile registers an FCM token only after an authenticated session, validates the `POST /notifications/fcm-token` contract at the API boundary, updates rotated tokens, and persists cleanup intent before bounded logout removal. A client UUID, per-token PostgreSQL advisory lock, and seven-day revocation tombstone make that cleanup win over a late registration POST. The backend includes an operating-system notification payload for background delivery, an Android channel, and APNs sound; foreground messages are presented by the client and taps allow only local deep links, including app launch from a terminated state. The open Driver inbox consumes the authenticated realtime stream and de-duplicates notification IDs.
- Admin and Restaurant are responsive from mobile through desktop, preserve locale in navigation, provide keyboard-operable navigation, a skip link, visible focus states, and reduced-motion behavior.
- User-facing copy is localized in Vietnamese, English, and Japanese.

## Non-functional requirements

| Area | Requirement |
|---|---|
| Reliability | Session-changing async work is cancellation-safe; notification fanout is idempotent and retryable. |
| Security | Secrets stay server-side; production rejects example/weak configuration; no implicit managed-to-local provider fallback. |
| Accessibility | Critical dashboard paths have labelled controls, semantic dialogs, minimum 44px touch targets where practical, keyboard access, and no serious/critical axe findings before release. |
| Observability | Health/readiness endpoints, durable job state, logs without secrets, and auditable admin actions. |
| Release quality | Final source head must pass local gates, fresh remote CI, provider preflight, and authenticated production smoke. |

## Acceptance criteria for the current hardening work

1. Backend notification delivery uses current FCM HTTP v1 credentials/configuration, does not depend on the legacy server key, validates FCM registration input at the API boundary, and covers provider failure plus invalid-token behavior with tests.
2. Driver login/logout, availability, dispatch response, and realtime listeners cannot let stale async work alter a new session or falsely represent a failed offline transition as success.
3. Restaurant navigation works as an accessible responsive sidebar/drawer and respects locale, focus, and motion preferences.
4. Technical docs describe the actual Railway/Supabase/Vercel topology, FCM credentials, testing scope, release blockers, and deployment order without presenting incomplete checks as production approval.

## Explicit release boundaries

The repository has no authority to deploy or validate external credentials. Before production release, operators must supply rotated provider secrets, run the complete final-head gate and remote CI, verify live FCM delivery with a controlled token, and complete authenticated browser smoke against the current deployment.
