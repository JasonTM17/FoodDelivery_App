# Hosted demo deployment

FoodFlow now has four Next.js web roles: Admin, Restaurant, Customer and Driver. The managed topology uses a NestJS Vercel Function API, a separate continuous worker, Supabase PostgreSQL/PostGIS/Realtime/Storage and TLS Redis. Configure the API and worker separately; Functions do not run a Socket.IO server. The worker preserves the existing one-second job poll, 15-second retry and 30-second offer contracts.

Use `backend/vercel.json` for the API and `backend/vercel.worker.json` for the worker project. Daemons are beta; the free Vercel quota can stop the worker when exhausted. This is a portfolio demo with provider limits, not a production availability guarantee. See the current provider documentation before choosing a paid capacity plan.

`DB_SSL_CA` supplies the public database CA certificate. The Prisma runtime writes that public certificate to a hash-named temporary file and enables strict certificate verification. Redis uses `rediss://`. Keep database passwords, Redis credentials, service-role credentials and realtime signing keys in server-only encrypted environment variables.

Run the reviewed [managed bootstrap](managed-bootstrap.md) before rollout. Historical migration bytes are retained. Provider-owned operations are completed through verified, hash-pinned compatibility checkpoints; forward migrations confine application tables and retire the obsolete browser outbox policy. Browser application data goes through the Nest API; private Broadcast authorization remains in `realtime.messages`.

A new, empty demo database may be initialized through `prisma/seed.ts` with `NODE_ENV=production`, `FOODFLOW_EMPTY_DEMO_BOOTSTRAP=CREATE_EMPTY_DEMO_ONLY` and a generated private `FOODFLOW_DEMO_PASSWORD` of at least 24 characters. This path refuses an existing user database. It deliberately inserts sample restaurants, customers, drivers, orders and support tickets. They are demonstration fixtures. Never use it to migrate an existing service or real customer data. Demo credentials are kept in an ignored local file and are not published in source.

Controller-observed checks on 2026-10-29: full backend suite 1242 passed, 7 skipped; dedicated real PostgreSQL migration checkpoint 63 passed; database TLS/pool tests 10 passed; typecheck/build passed. The four-role web workspace passed typecheck, 379 Vitest tests and 3 build-selector tests; all four builds passed. Supabase migrations/Storage and Redis GEO/Lua were checked live. Actual deployed API/worker/browser receipts remain a separate acceptance gate.

SMTP, push, SMS, payment, directions and AI providers are optional integrations requiring their own valid configuration. Disabled providers must report unavailable; this deployment does not assert those integrations succeeded.
