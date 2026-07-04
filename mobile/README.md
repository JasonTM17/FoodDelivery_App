# FoodFlow Mobile

## 1. Purpose

Flutter monorepo containing two mobile applications for the FoodFlow platform. The **customer app** provides restaurant discovery (PostGIS nearby search), food ordering, realtime order tracking on map, AI chat assistant, and order history. The **driver app** provides order request acceptance, GPS background tracking, turn-by-turn delivery flow, earnings dashboard, and delivery history. Both apps consume the NestJS backend API and connect to the Socket.IO WebSocket gateway for realtime features.

## 2. API Surface

These apps are frontend-only consumers. They call the backend REST API and maintain a persistent WebSocket connection:

| App | Entry Point | Primary Users |
|-----|------------|---------------|
| Customer | `lib/main_customer.dart` | End customers ordering food |
| Driver | `lib/main_driver.dart` | Delivery drivers |

### External API Dependencies

- **Backend API**: configured via `ApiClient` in `lib/shared/api/api_client.dart`
- **WebSocket**: configured via `SocketClient` in `lib/shared/api/socket_client.dart`
- **Google Maps**: embedded map component for location picker and tracking

## 3. Env Vars

Configuration is read from Dart defines. Debug/test builds keep an emulator-friendly local default, but release builds must pass a real backend API URL; they no longer silently fall back to localhost or `10.0.2.2`.

```bash
$env:GOOGLE_MAPS_API_KEY="your-native-google-maps-key"
flutter run -t lib/main_customer.dart \
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api
```

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `API_BASE_URL` | Release: yes; debug/test: no | Debug/test only: `http://10.0.2.2:3001/api` | Backend API base URL |
| `WS_URL` | No | Derived by stripping `/api` from `API_BASE_URL` | Socket.IO gateway root; set only when it differs from the REST API origin |
| `GOOGLE_MAPS_API_KEY` | Yes for map screens | — | Native Google Maps SDK key. Android reads this from an environment variable or Gradle property; iOS reads it from gitignored `ios/Flutter/GoogleMapsKeys.xcconfig`. Never commit the key. |

## 4. Run Locally

```bash
# Prerequisites: Flutter SDK 3.12+, backend running on :3001

# 1. Install dependencies
flutter pub get

# 2. Run code generation (required if models or providers changed)
flutter pub run build_runner build --delete-conflicting-outputs

# 3. Run customer app
flutter run -t lib/main_customer.dart

# 4. Run driver app (separate terminal/simulator)
flutter run -t lib/main_driver.dart

# 5. For physical device, ensure the API URL points to your machine's LAN IP:
flutter run -t lib/main_customer.dart \
  --dart-define=API_BASE_URL=http://192.168.1.100:3001/api
```

## 5. Test

```bash
# Run all Flutter tests
flutter test

# Run tests for a specific directory
flutter test test/customer/
flutter test test/driver/
flutter test test/shared/

# Run with coverage
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

Coverage thresholds: lines >= 80%, branches >= 70%.

## 6. Runbook

### Regenerating Models After Backend API Changes

```bash
cd mobile
flutter pub run build_runner build --delete-conflicting-outputs
```

This regenerates Freezed models and JSON serialization code. Run whenever `dto` classes or API response shapes change upstream.

### Switching Between Environments

Pass the API base URL via `--dart-define`; do not edit runtime source files for environment switching:

```bash
# Development on Android emulator
flutter run -t lib/main_customer.dart --dart-define=API_BASE_URL=http://10.0.2.2:3001/api

# Staging
flutter run -t lib/main_customer.dart --dart-define=API_BASE_URL=https://staging-api.foodflow.vn/api

# Production
flutter run -t lib/main_customer.dart --dart-define=API_BASE_URL=https://api.foodflow.vn/api
```

### Debugging WebSocket Connection Issues

1. Verify backend is running and WebSocket gateway is reachable
2. Check the `WS_URL` matches backend address and port
3. Check WebSocket CORS origins in backend `.env`
4. Enable Flutter WebSocket debug logging:
   ```dart
   // In socket_client.dart, set socket.io options:
   SocketOptions(enableLogging: true)
   ```

### Build APK/IPA for Distribution

The Batch 4 mobile tree now includes Flutter Android and iOS platform projects
under `mobile/android` and `mobile/ios`. Android debug APK builds were verified
locally on 2026-07-04 for both entrypoints.

```bash
# Android debug APK (customer)
flutter build apk --debug -t lib/main_customer.dart

# Android debug APK (driver)
flutter build apk --debug -t lib/main_driver.dart

# Android release APK (customer)
flutter build apk -t lib/main_customer.dart --release

# Android release APK (driver)
flutter build apk -t lib/main_driver.dart --release

# iOS (requires macOS + Xcode)
flutter build ios -t lib/main_customer.dart --release
```

Android release builds must not use debug signing. Set these values via
environment variables or Gradle properties before running a release build:

| Name | Description |
|------|-------------|
| `FOODFLOW_UPLOAD_STORE_FILE` | Absolute or project-relative path to the Android upload keystore |
| `FOODFLOW_UPLOAD_STORE_PASSWORD` | Upload keystore password |
| `FOODFLOW_UPLOAD_KEY_ALIAS` | Upload key alias |
| `FOODFLOW_UPLOAD_KEY_PASSWORD` | Upload key password |

If these values are missing, the Gradle release task fails before signing. For
iOS local development, create a gitignored key file:

```xcconfig
// mobile/ios/Flutter/GoogleMapsKeys.xcconfig
GOOGLE_MAPS_API_KEY=your-native-google-maps-key
```

### Clearing Flutter Build Cache

```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Adding a New Customer Screen

1. Create screen in `mobile/lib/customer/screens/<name>_screen.dart`
2. Create or extend provider in `mobile/lib/shared/providers/` if needed
3. Use shared widgets from `mobile/lib/shared/widgets/` (FoodCard, RestaurantCard, LoadingShimmer, EmptyState, ErrorState, OrderStatusBadge)
4. Wire up navigation in the GoRouter configuration
