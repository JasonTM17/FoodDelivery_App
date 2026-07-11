# FoodFlow Mobile

## Purpose

This Flutter workspace builds two FoodFlow applications:

| App | Entry point | Runtime scope |
|---|---|---|
| Customer | `lib/main_customer.dart` | Discovery, cart/checkout, order tracking, maps, notifications, AI support |
| Driver | `lib/main_driver.dart` | Dispatch offers, GPS tracking, routed delivery, earnings, history |

Both apps use the NestJS REST API for business mutations. Managed production
receives authorized events through Supabase Realtime. Socket.IO remains an
explicit local/self-hosted compatibility transport.

## Runtime contract

- HTTP: `lib/shared/api/api_client.dart` and the checked-in OpenAPI client.
- Realtime facade: `lib/shared/api/realtime_client.dart`.
- Managed realtime: short-lived `POST /realtime/token` grants and filtered
  `realtime_outbox` subscriptions.
- Local compatibility: `lib/shared/api/socket_client.dart`.
- GPS and maps: `geolocator`, `google_maps_flutter`, backend route geometry,
  ETA, and route phase. The client does not fabricate straight-line routes.
- Dispatch: offers arrive on the private driver channel; accept/reject uses
  authenticated `POST /driver/dispatch/offers/{orderId}/respond`.
- Driver KYC: terms are persisted first, then typed license/vehicle data is
  carried through onboarding. Each JPEG/PNG/WebP document is uploaded with a
  driver-scoped `POST /driver/kyc/uploads` grant; only the returned private
  object key is submitted to `POST /driver/kyc`. Mobile never derives a public
  URL from a signed upload URL.

## Environment

Configuration uses Dart defines. Release builds fail closed when the API or
realtime provider configuration is missing.

| Name | Required | Description |
|---|---|---|
| `API_BASE_URL` | Release | Verified backend base ending in `/api` |
| `REALTIME_PROVIDER` | Release | `supabase` in managed production; `socketio` only for local/self-hosted use |
| `SUPABASE_URL` | Provider `supabase` | Supabase project HTTPS origin |
| `SUPABASE_ANON_KEY` | Provider `supabase` | Public anon/publishable key; never service-role/JWT secrets |
| `WS_URL` | Provider `socketio`, optional | Socket.IO origin; defaults to `API_BASE_URL` without `/api` |
| `GOOGLE_MAPS_API_KEY` | Map builds | Native Maps SDK key from environment/Gradle or ignored iOS xcconfig |

Never put service-role keys, Supabase JWT secrets, DeepSeek keys, database URLs,
or Android upload passwords in Dart defines or source control.

## Local development

Prerequisites: Flutter stable with Dart 3.12+, API on port 3001, and the local
Socket.IO stack.

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs

flutter run -t lib/main_customer.dart \
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api \
  --dart-define=REALTIME_PROVIDER=socketio

flutter run -t lib/main_driver.dart \
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api \
  --dart-define=REALTIME_PROVIDER=socketio
```

For a physical device, replace `10.0.2.2` with the development machine's LAN
address. Do not edit source files to switch environments.

## Managed-production build inputs

Use provider aliases verified during deployment; do not copy retired or example
domains into a release:

```bash
flutter run -t lib/main_customer.dart \
  --dart-define=API_BASE_URL=https://<verified-api-alias>/api \
  --dart-define=REALTIME_PROVIDER=supabase \
  --dart-define=SUPABASE_URL=https://<project>.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<public-anon-key>
```

The scoped Supabase JWT is obtained at runtime from the API, expires after five
minutes, and is refreshed before expiry. Mobile never signs its own grant and
never publishes business events directly to Supabase.

## Test gates

```bash
flutter pub get
flutter analyze
flutter test

# Optional coverage artifact
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

Run customer and driver tests plus release-flavor compilation after changes to
realtime, maps, native manifests, or Dart defines. Generated API/model changes
must come from the canonical OpenAPI contract, not handwritten guesses.

## Android builds

```bash
# Debug compatibility builds
flutter build apk --debug --flavor customer -t lib/main_customer.dart \
  --dart-define=REALTIME_PROVIDER=socketio
flutter build apk --debug --flavor driver -t lib/main_driver.dart \
  --dart-define=REALTIME_PROVIDER=socketio

# Release customer; use the same defines for the driver flavor/entrypoint
flutter build apk --release --flavor customer -t lib/main_customer.dart \
  --dart-define=API_BASE_URL=https://<verified-api-alias>/api \
  --dart-define=REALTIME_PROVIDER=supabase \
  --dart-define=SUPABASE_URL=https://<project>.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<public-anon-key>
```

Release signing must come from secure CI/host configuration:

| Name | Description |
|---|---|
| `FOODFLOW_UPLOAD_STORE_FILE` | Android upload keystore path |
| `FOODFLOW_UPLOAD_STORE_PASSWORD` | Keystore password |
| `FOODFLOW_UPLOAD_KEY_ALIAS` | Upload key alias |
| `FOODFLOW_UPLOAD_KEY_PASSWORD` | Upload key password |

The Gradle release task fails when these values are absent. The customer and
driver flavors install as `vn.foodflow.customer` and `vn.foodflow.driver`.

For local iOS development, create the ignored file below:

```xcconfig
// mobile/ios/Flutter/GoogleMapsKeys.xcconfig
GOOGLE_MAPS_API_KEY=your-native-google-maps-key
```

iOS release compilation requires macOS, Xcode, and valid signing profiles.

## Realtime troubleshooting

1. Confirm the release uses `REALTIME_PROVIDER=supabase` with the correct
   project origin and public key.
2. Request `POST /realtime/token` with an authenticated user and verify only
   required `private:` channels are returned.
3. Verify the requested order channel is present and another tenant is denied.
4. Confirm `realtime_outbox` RLS and the explicit Supabase publication.
5. Confirm GPS and dispatch responses appear as REST requests, while outbox
   inserts arrive through Supabase Realtime.
6. For local Socket.IO only, verify `WS_URL` and WebSocket CORS.

## Driver KYC troubleshooting

1. Confirm the authenticated account has role `driver` and accepted the
   current terms version.
2. Check that all four documents are valid JPEG, PNG, or WebP images no larger
   than 4 MB; file extension alone is not trusted.
3. Verify each upload uses exactly the non-credential headers returned by
   `POST /driver/kyc/uploads` and that no API bearer token is sent to storage.
4. Submit opaque object keys, not signed URLs or public URLs. The backend checks
   driver ownership, object uniqueness, stored metadata, and magic bytes.
5. A pending submission cannot be duplicated. Rejected submissions show the
   server status after the next authenticated login and can be retried within
   the configured limit.

## Cache recovery

```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```
