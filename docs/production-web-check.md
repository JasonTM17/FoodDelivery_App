# FoodFlow four-web production check

Observed on **30 October 2026** using existing synthetic demo accounts. This is a bounded portfolio verification, not a commercial production certification.

## Deployment identity

| Component | Observed source/state |
| --- | --- |
| Customer | https://foodflow-customer.vercel.app — health200, revision9776b500bb5eaf1b96baf16ece2306cafdb7f82f |
| Driver | https://foodflow-driver.vercel.app — health200, revision7a99183890955c496bfda3162041fb5d5898b3a2 |
| Restaurant | https://foodflow-restaurant-ochre.vercel.app — initial19a839bc; bootstrap repair deployed separately |
| Admin | https://foodflow-admin-two.vercel.app — initial19a839bc; bootstrap repair deployed separately |
| API | https://foodflow-api-3td0.onrender.com — Render LIVE at9a1d36dbb6a8044a925eb4655056f13a75808cd0 |
| Readiness | readytrue; PostgreSQL, TLS Redis and Supabase Storage up |

Backend health reports revisionnull; the API source identity above comes from the Render deployment API rather than inference from readiness. Web revision differences are recorded honestly; this is not an immutable unified release.

## Fresh runtime checks

| Check | Observation | Result |
| --- | --- | --- |
| Four origins | HTTP200 pages and health endpoints with expected service names | PASS |
| Four roles | Fresh API login and persisted profile200 for customer, driver, restaurant and admin | PASS |
| Public catalog |20restaurants; menus across all20returned140items | PASS |
| Customer browser | Login, discovery, menu, add-to-cart, checkout COD, success and persisted tracking | PASS |
| Restaurant browser | Login, overview, menu and queue containing the newly created order | PASS |
| Admin browser | Login, overview, orders containing the same new order | PASS |
| Driver browser | Existing session, dashboard connected realtime, trip history and earnings reads | PASS |
| Driver API | Fresh login/profile, history and earnings200 | PASS |
| Ownership | New order owner200, other customer404, anonymous401 | PASS |
| Role boundaries | Customer requesting Admin/Restaurant/Driver APIs403 | PASS |
| Realtime grants | Owner order token201; other customer403 | PASS |
| Responsive | Customer tracking and Driver dashboard at verified390px; scrollWidth390 | PASS |
| Loaded images | No broken loaded images detected in checked Customer views | PASS, bounded to those views |

The new synthetic COD order is `3e512a88-b668-41bc-b188-81b3c220b54a`, code `FD261030T5GK`,80,000VND. Independent HTTP verified it exists for the owner, Admin and Restaurant. Its note says no real delivery/payment. It remains a demo fixture; no driver was dispatched or state artificially advanced by this check.

The retained Driver screen displayed online availability and an authorized realtime connection. This pass did not toggle availability, invent GPS or claim a fresh dispatch/delivery. The previous completed synthetic trip is historical data shown in the trip/earnings screens, not a real delivery performed today.

## Observed authentication defect and repair

Opening Admin/Restaurant protected roots with an old stored session initially showed an empty screen. Failed validation could remove the access token before the bootstrap finalizer checked strict token equality, leaving `isAuthChecked=false` indefinitely.

The initial repair95e1d312 adds completion after cleanup and had four failing expired-session regressions turn green across both apps, while retaining stale-new-login regressions. It was deployed to both domains and a deliberately invalid token in a separate browser test returned to the login form instead of remaining blank. Test values were removed by the app; no real password changed.

Independent review then falsified completion for successful refresh during bootstrap and expiry during Restaurant's second profile request. The final repair revalidates a rotated token within a bounded bootstrap loop, preserves cancellation/session-epoch guards and completes anonymously when validation fails. Final commit, deployment and CI evidence are recorded below after verification. Do not treat the initial repair alone as the complete acceptance claim.

## Boundaries

- No live payment, SePay transaction, SMTP email, SMS, push delivery, actual identity document, external routing provider or AI response was verified. UI controls alone do not prove provider operation.
- Signed realtime credential allow/deny is freshly checked; websocket delivery/renewal and worker restart evidence in [hosted-demo.md](hosted-demo.md) are earlier dated receipts, not a fresh full rerun here.
- Render Free can sleep after15minutes without inbound traffic, pausing API/embedded worker until HTTP wake. No uptime or continuously running worker guarantee.
- Some labels remain mixed-language and some menu images use fallbacks; complete localization and photographic coverage are not claimed.
- This pass does not certify every route, mutation, browser, device, physical GPS, throughput or production recovery scenario. Database records and financial/brand claims are synthetic.
- [Media manifest](showcase/production-web/manifest.json) and [capture notes](showcase/README.md) identify screenshots/GIFs; media are edited keyframes, not speed measurements.

## Final bootstrap repair acceptance

The bounded independent review of commit `7f032a4fbcbd3f3a890ae46073277000ab33e382` returned **NOT_FALSIFIED** after nine schedules covering refresh, second-request expiry, newer-login preservation, cancellation and bounded repeated rotation. Focused app suites passed4Admin and5Restaurant tests; both apps passed typecheck and lint. The earlier narrow expired-session regressions were first observed failing on the old code.

The final repair is being deployed as `dpl_9fSMWAFiTS9d4FBXzfW1GcTvCc4Q` (Admin) and `dpl_288qMmB7JRxRNEPLmqG8FPkqV97a` (Restaurant). Provider readiness and actual domain behavior must be checked before calling rollout complete; source CI/PR state remains separately inspectable on GitHub. The [commit history](https://github.com/JasonTM17/FoodDelivery_App/commits/feature/production-showcase) identifies the reviewed change without implying the API or Customer/Driver apps share its revision.
