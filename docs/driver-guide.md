# Driver Guide

Languages: **English** | [Tiếng Việt](./driver-guide.vi.md) | [日本語](./driver-guide.ja.md)

FoodFlow Driver is the native Flutter/Riverpod delivery application for Android and iOS. This guide follows the current authenticated routes and Driver shell. It does not claim that a mobile release, live dispatch provider, or production background-location matrix is certified.

![Driver sign-in, Home, earnings, and profile preview](./media/gifs/driver-role-flow.gif)

This four-frame GIF is generated only from privacy-reviewed deterministic local Android AVD stills. It is product/regression documentation, not an authenticated production journey.

## Prerequisites

- Install/run the Driver flavor from [main_driver.dart](../mobile/lib/main_driver.dart).
- Use a Driver account with the required agreement and verification state. The local capture uses a deterministic seed identity; its password is masked and not documented.
- Enable location only when testing Online/dispatch behavior. The app must not show Online until a fresh location sample and the authenticated API command succeed.

```powershell
cd mobile
flutter pub get --enforce-lockfile
flutter run --flavor driver -t lib/main_driver.dart `
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api `
  --dart-define=REALTIME_PROVIDER=socketio
```

Use the development machine's reachable LAN address on a physical device instead of Android emulator host `10.0.2.2`.

## Sign in and reach Home

1. Enter the Driver email and password and submit once.
2. If the current terms are not accepted, complete the agreement. If verification is still required, complete vehicle, document, and KYC steps.
3. A ready Driver lands on **Home**. During an active delivery, Home shows whether GPS sharing is active or must be resumed; the switch still reflects actual Online availability.
4. Use the three primary tabs: **Home**, **Earnings**, and **Profile**.

## Go Online and handle a delivery

1. On **Home**, turn on the Online control.
2. Grant required location/foreground notification permissions when prompted. The app obtains a fresh device location before requesting Online status.
3. Wait for API confirmation. A stale/failing GPS sample or rejected command must leave the Driver truthfully Offline.
4. An authorized dispatch offer opens an accept/reject dialog. Accept only when ready to perform the delivery.
5. Follow the delivery flow, pickup confirmation, and completion screens. Route geometry and ETA must come from accepted backend data; unavailable data remains unavailable.
6. Return Offline when ending the shift so foreground tracking can stop.

The local role capture used fixed simulated GPS and no Google Maps API key. This capture fact does not certify a mobile map provider or live routing. Web Admin/Restaurant maps separately use keyless OpenFreeMap; mobile map widgets are not relabelled as OpenFreeMap.

## Earnings, history, and profile

- **Earnings** switches between today, week, and month summaries and shows history returned by the API.
- **Home** shows today's earnings, order count, online time, rating, active work, and recent orders when available.
- **Profile** shows Driver/vehicle summary, ratings and totals, language selection, and sign-out. Other authenticated routes include delivery history/detail, incentives, heatmap, ratings, bank account, notifications, support, and settings.
- Values in the screenshots are deterministic local seed data, not real people, payouts, or production balances.

## Visual reference

| Sign-in | Active-delivery Home |
|---|---|
| ![Driver sign-in](./screenshots/driver/01-login.webp) | ![Driver Home](./screenshots/driver/02-home.webp) |

| Earnings | Profile |
|---|---|
| ![Driver earnings](./screenshots/driver/03-earnings.webp) | ![Driver profile](./screenshots/driver/04-profile.webp) |

The [product gallery](./product-gallery.md#driver) also retains local GPS/foreground-tracking evidence from the isolated E2E stack.

## Troubleshooting

| Symptom | Action |
|---|---|
| Sign-in returns to login | Check API reachability and Driver role; do not inject or reuse another role's token. |
| Routed to agreement/KYC | Complete the required onboarding state; do not bypass the route with a copied URL. |
| Cannot go Online | Check location permission, fresh GPS, network, and API response. Keep the truthful Offline state on failure. |
| No dispatch offer | Confirm Online was accepted and the configured realtime provider is connected; do not fabricate an offer. |
| No route/ETA | Wait for valid backend data. Do not draw a straight-line fallback or invented ETA. |
| No device push | Check notification permission and build-specific Firebase metadata; use the authenticated in-app inbox as fallback. |

## Evidence boundary

The four Driver role stills were captured on an Android API 35 x86_64 AVD connected to the isolated local E2E stack. Flutter debug APKs came from the current dirty working tree, with deterministic seed data and masked passwords. The media is privacy-reviewed regression/product evidence—not mobile release, background-location, payout, dispatch, Supabase/Railway, or production certification. See [capture provenance](./screenshots/README.md) and the [mobile overview](./customer-driver-guide.md).
