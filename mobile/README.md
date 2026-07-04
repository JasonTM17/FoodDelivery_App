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
flutter run -t lib/main_customer.dart \
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api \
  --dart-define=GOOGLE_MAPS_API_KEY=your-key
```

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `API_BASE_URL` | Release: yes; debug/test: no | Debug/test only: `http://10.0.2.2:3001/api` | Backend API base URL |
| `WS_URL` | No | Derived by stripping `/api` from `API_BASE_URL` | Socket.IO gateway root; set only when it differs from the REST API origin |
| `GOOGLE_MAPS_API_KEY` | No | — | Google Maps API key (required for map features) |

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

Release builds require Flutter platform projects to exist under `mobile/android`
and `mobile/ios`. The current Batch 4 tree is a Dart/Flutter workspace with
shared customer/driver code and tests, but it does not yet contain those platform
folders; `flutter build apk --debug` therefore stops before compilation with an
unsupported Gradle project message. Generate/reconcile the Android and iOS
platform projects in the dedicated mobile phase before treating APK/IPA builds
as release gates.

```bash
# Android APK (customer)
flutter build apk -t lib/main_customer.dart --release

# Android APK (driver)
flutter build apk -t lib/main_driver.dart --release

# iOS (requires macOS + Xcode)
flutter build ios -t lib/main_customer.dart --release
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
