# Four FoodFlow web roles

The Next.js workspace now contains Admin, Restaurant, Customer and Driver applications. Customer runs locally on port 3003; Driver runs on port 3004. Existing Admin/Restaurant commands remain in their app package manifests.

Customer supports restaurant discovery/search, menus and item options, guest/server carts, sign-in/registration, addresses, checkout with retry-safe idempotency keys, order history, cancellation/reviews and tracking. Driver supports role-checked sign-in, browser GPS with explicit permission/error states, online status, realtime dispatch offers, valid delivery transitions, delivery history and earnings.

The new applications use the existing API client, backend contracts and Supabase private realtime adapter. Backend data remains authoritative; no coordinates, payment results, routing results or delivery transitions are fabricated. Driver offers require a working realtime provider; the active-order fallback does not reproduce an offer-list endpoint that the API does not provide.

Configure NEXT_PUBLIC_API_URL with the real HTTPS API prefix and NEXT_PUBLIC_REALTIME_PROVIDER=supabase, plus the project's public Supabase URL/publishable key. Service-role credentials, private JWT signing keys, database passwords and Redis credentials belong only in server environments. Admin also needs NEXT_PUBLIC_ADMIN_URL for its metadata base.

Controller verification on 2026-10-28: workspace typecheck passed; 379 Vitest tests and 3 build-selector Node tests passed. All four production builds passed (Admin/Restaurant with actual public hosting configuration). This verifies compilation and test behavior; deployed authenticated journeys and browser GPS/device behavior require separate live checks.
