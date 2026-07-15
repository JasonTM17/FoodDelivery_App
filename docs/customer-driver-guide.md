# Customer and Driver Mobile Guide

Languages: **English** | [Tiếng Việt](./customer-driver-guide.vi.md) | [日本語](./customer-driver-guide.ja.md)

FoodFlow has two first-class native mobile products, not an Admin-only web
experience. This guide documents workflows verified against the Flutter routers
and screens. It is a source guide, not a claim that a provider-backed production
deployment or mobile release has been approved.

## Choose the right app

| Product | Who uses it | Android package/flavor | Entrypoint |
|---|---|---|---|
| Customer | People ordering food | `vn.foodflow.customer` / `customer` | [`main_customer.dart`](../mobile/lib/main_customer.dart) |
| Driver | Verified delivery drivers | `vn.foodflow.driver` / `driver` | [`main_driver.dart`](../mobile/lib/main_driver.dart) |

Both use the authenticated NestJS API. In managed production, they receive
allow-listed events through scoped Supabase Realtime credentials; Socket.IO is
only the explicit local/self-hosted option. There is no Customer or Driver web
URL to browse.

## Role guides

For the Customer's step-by-step ordering journey, permission behaviour, address
limitation, checkout, tracking, and help, use the standalone
[Customer guide](./customer-guide.md). For Driver sign-in, Online/GPS truth,
dispatch, earnings, and profile, use the standalone [Driver guide](./driver-guide.md).
This document remains the shared mobile/runtime overview.

## Customer journey

1. **Start and sign in.** The app begins at the splash screen, then uses the
   authenticated Customer routes. New users can register; current auth routing
   sends both sign-in and registration to Home. Location and notification
   prompts are handled by the relevant feature and device flow, not a mandatory
   post-auth onboarding chain. Either permission can be declined; the app must
   show the resulting limited state rather than inventing location or push data.
2. **Find food.** Home, search, restaurant list/filter, restaurant detail, and
   food detail screens lead to a cart. Favorites and vouchers are available
   from authenticated Customer routes.
3. **Review the cart and checkout.** Checkout requires a selected delivery
   address. It passes the selected address, payment method, optional notes, and
   the cart promotion code to the API. The current UI offers cash and wallet;
   the server remains the authority for availability, price, promotion, and
   payment outcome.
4. **Follow the order.** Successful checkout opens order tracking. The app
   loads order detail, starts authenticated tracking for that order, and stops
   tracking when the screen closes. Map camera/route points are accepted only
   when valid; the client does not draw a made-up straight-line route or ETA.
5. **Finish or get help.** Order history links to tracking and review. The
   cancellation screen sends a chosen reason and optional note; whether a
   cancellation or refund is accepted is server-controlled. Profile also links
   to addresses, wallet, loyalty, referral, favorites, notifications, and the
   help centre/chat.

### Customer notifications

After a valid Customer session, the app may request notification permission and
register an FCM token when public Firebase build metadata is present. Push taps
only accept local destinations for notifications or orders; unsupported links
fall back to the in-app notification inbox. A missing Firebase configuration
disables FCM registration only — it is not a reason to fake a successful push.

## Driver journey

1. **Sign in and complete onboarding.** An authenticated Driver who has not
   accepted the current terms is routed to the agreement. A driver who still
   needs verification proceeds through vehicle details, documents, and KYC.
   KYC uses typed data and private upload grants; do not paste signed upload
   URLs or credentials into the app.
2. **Go online with real GPS.** The Driver home contains the Online control.
   Going online obtains a fresh location sample, then the API accepts or rejects
   the availability command. A failed or stale GPS sample must leave the UI in
   its truthful state; it must not appear online merely because the switch was
   tapped.
3. **Respond to dispatch.** A new authorized offer opens a non-dismissible
   accept/reject dialog. Accepted work continues through delivery flow, pickup
   confirmation, and delivery completion screens. Route geometry and ETA come
   from accepted backend data; unavailable data is shown as unavailable.
4. **Operate the account.** Driver routes cover delivery history/detail,
   earnings, incentives, heatmap, ratings, bank account, support, settings, and
   the offline-status screen. These are driver-only authenticated routes; they
   are not substitutes for Admin or Restaurant permissions.

### Driver notifications

The Driver inbox is an authenticated route and also receives the allowed
realtime notification stream while open, de-duplicated by notification ID.
Push taps can navigate only to notifications, earnings, or profile after the
Driver authentication state permits it; a tap received during session restore
is held until authentication resolves. Unknown destinations fall back to the
notification inbox.

## Run on an emulator or device

For a local API started on the development computer, Android emulators use
`10.0.2.2`. A physical device must use the machine's reachable LAN address.

```powershell
cd mobile
flutter pub get --enforce-lockfile

flutter run --flavor customer -t lib/main_customer.dart `
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api `
  --dart-define=REALTIME_PROVIDER=socketio

flutter run --flavor driver -t lib/main_driver.dart `
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api `
  --dart-define=REALTIME_PROVIDER=socketio
```

For managed production, use verified provider aliases and
`REALTIME_PROVIDER=supabase`; Firebase validation also requires the four public
`FIREBASE_*` values matching the selected flavor. Never put an FCM service
account, Supabase service-role credential, database URL, or signing secret into
a Dart define. Full setup, Android builds, and troubleshooting are in the
[mobile README](../mobile/README.md).

## Visual and release boundary

| Customer app launch | Driver active-delivery Home |
|---|---|
| ![Customer public authentication flow](./media/gifs/customer-auth-flow.gif) | ![Driver Home](./screenshots/driver/02-home.webp) |

The gallery contains current Customer/Driver role stills plus earlier local
GPS/permission captures. They came from Android AVD testing against the isolated
E2E stack, using deterministic seed identities, masked passwords, and a dirty
working tree. The role capture used fixed simulated GPS and no Google Maps API
key. It is privacy-reviewed regression/product evidence, not mobile release,
payment, dispatch, routing, background-location, provider, or production proof.
Use the [gallery capture procedure](./product-gallery.md#capture-procedure) for
a new clean-head visual record.

Related: [product requirements](./project-overview-pdr.md),
[testing guide](./testing-guide.md), and [product gallery](./product-gallery.md).
