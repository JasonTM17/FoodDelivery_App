---
date: 2026-07-14
session: railway-supabase-recovery
---

# Journal: 2026-07-14 — Railway and Supabase Recovery

## Context

FoodFlow needed its Railway API and worker restored against managed Supabase without inventing Google Maps or other provider credentials. The goal was process health with explicit feature degradation, followed by evidence strong enough to separate recovered infrastructure from full production certification.

## What Happened and Root Causes

The failure was a chain, not one bad deploy:

1. Production validation treated 15 optional integrations as mandatory startup dependencies. API and worker could not boot when routing, AI, payment, messaging, or notification providers were intentionally disabled.
2. After startup validation was fixed, the public Railway domain still targeted local port `3001` while Railway assigned application `PORT=8080`. A healthy process was unreachable through the domain.
3. Supabase Storage rejected the opaque `sb_secret...` credential with `Invalid Compact JWS`. The Storage Bearer contract still required the legacy `service_role` JWT, limited in application use to the Storage adapter.
4. The shared Docker image hard-coded the API entrypoint and an API-only healthcheck. The worker therefore had no reliable process entrypoint, and the image healthcheck assumed the wrong fixed port.

The frustrating part was the serial nature of the failures: each corrected boundary exposed the next one. Treating the first successful build as recovery would have left either the public API, Storage readiness, or worker dead.

## Decisions and Alternatives

| Decision | Alternative rejected | Rationale and impact |
| --- | --- | --- |
| Make external providers optional at startup, but validate configured values and partial credential groups | Require every provider in production | Core API/worker stay available; disabled features fail explicitly instead of blocking unrelated workloads. |
| Return `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED` when neither Google Directions nor an owned OSRM exists | Silently use the public OSRM demo service | No unowned production dependency, invented route, or hidden quota risk. |
| Use the legacy `service_role` JWT only for Supabase Storage authorization | Reuse the opaque platform secret for Storage | Matches the Storage JWT contract and restores readiness without exposing credentials. |
| Let Railway own API health and dynamic port routing | Keep the image-level `localhost:3001` healthcheck | One image can run under Railway's dynamic `PORT`; the platform checks the actual API service. |
| Select API or worker from `FOODFLOW_PROCESS_ROLE` in one image | Maintain an API-only image or duplicate a worker image | Keeps one release artifact while giving the worker an explicit `dist/workers/main.js` entrypoint. |
| Set `RAG_ENABLED=false` without a DeepSeek credential | Let the worker retry a provider that cannot succeed | Prevents noisy failed synchronization and misleading AI availability. |

## Evidence

- Commit `7b076970335ab63516b2a76b692a4e01076fdc32` fixes optional-provider validation and production routing failure behavior.
- Commit `93cdb7061d18d54d1739d4ab31927d7c21ae1b56` fixes Storage authorization, dynamic Railway health ownership, and the worker entrypoint; `32c52fe0ccca214f65c4e2564c844dba428519b2` makes production process roles fail closed; `52f433641d5093f6d064cfba6c1cd99c8cb035e9` fixes Windows PowerShell health probes.
- Backend verification: 144 Jest suites / 1065 tests, typecheck, lint, production build, and every GitHub workflow triggered for `52f4336` passed.
- Railway migrate `a9002614-ed2a-438c-9a4e-7170954052fc`, API `4e51ae50-1218-4c1b-a315-3c31ddf6de5c`, and worker `4f818c68-ce66-4aab-ae6e-f8ed708b4f91` deployed immutable SHA images successfully. Public health/readiness reported database, Redis, and Supabase Storage up; worker polling started.
- Controlled production GPS reached authorized private Broadcast and PostGIS in 1437 ms. All temporary database and Redis state was removed afterward.
- Production now requires explicit `FOODFLOW_PROCESS_ROLE=api|worker`; missing or unknown roles fail before the wrong process can start.
- No credential value was written to source, logs, or this journal.

## Impact

Railway now serves a healthy, ready API and runs the intended background worker. Supabase database, Redis, and Storage readiness are proven for the deployed API. Missing routing and AI providers no longer cause system-wide startup failure.

This recovery is not full production approval. Route calculation remains deliberately unavailable without an owned directions provider, and RAG remains disabled. Payment, notification, messaging, authenticated user flows, and the deployed web-to-API path still lack production smoke evidence.

## Remaining Risks and Next Steps

1. Release owner, before certification: run authenticated Customer, Driver, Restaurant, and Admin flows against the current Railway API, including tenant isolation and Supabase private Realtime.
2. Web release owner, before certification: prove the exact Admin and Restaurant Vercel deployments target the current API and pass authenticated smoke.
3. Integration owner, before enabling each feature: configure and smoke SePay, FCM on a controlled device, SMTP, and Twilio without printing credentials.
4. Routing owner, before route-dependent production use: provision an owned OSRM endpoint or explicitly approve another owned directions provider; verify timeout and failure behavior.
5. AI owner, before enabling RAG: configure DeepSeek, enable RAG, then prove indexing, retrieval, usage telemetry, and fail-closed behavior.
6. Release owner, before promotion: bind the verified source to an immutable release artifact and rerun the provider-specific production gates.

## Unresolved Questions

- Which owned routing service will replace the intentionally absent Google/OSRM configuration?
- Which Vercel deployment URLs and controlled FCM device are authorized for final production smoke?
- Which immutable SHA image will be nominated as the release candidate after remaining provider tests pass?
