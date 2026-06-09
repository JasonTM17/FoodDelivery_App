import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import 'route_names.dart';

const _storage = FlutterSecureStorage();

/// Auth guard for go_router redirect callback.
///
/// Checks FlutterSecureStorage for a stored auth token. Unauthenticated users
/// accessing protected routes are redirected to /login with a `from` param.
/// Authenticated users hitting entry-level routes (splash, onboarding) are
/// bounced to /home.
///
/// Returns null if navigation is allowed, or a route path string to redirect.
Future<String?> authGuard(BuildContext context, GoRouterState state) async {
  final location = state.uri.toString();
  final isAuthRoute = _publicRoutes.any((r) => location.startsWith(r));

  final token = await _storage.read(key: 'auth_token');
  final isLoggedIn = token != null && token.isNotEmpty;

  if (isLoggedIn) {
    // Redirect away from entry-level routes when already authenticated.
    if (_entryRoutes.any((r) => location.startsWith(r))) {
      return Routes.home;
    }
    return null;
  }

  // Not logged in — allow public routes, redirect protected ones.
  if (isAuthRoute) return null;

  return '${Routes.login}?from=${Uri.encodeComponent(location)}';
}

/// Routes accessible without authentication.
const _publicRoutes = [
  Routes.splash,
  Routes.login,
  Routes.register,
  Routes.onboarding,
  Routes.onboardingLocation,
  Routes.onboardingNotification,
  Routes.locationPermission,
  Routes.home,
  Routes.search,
  Routes.restaurants,
  Routes.restaurantDetail,
  Routes.foodDetail,
];

/// Entry-level routes to redirect away from when logged in.
const _entryRoutes = [
  Routes.splash,
  Routes.onboarding,
  Routes.onboardingLocation,
  Routes.onboardingNotification,
  Routes.login,
  Routes.register,
];
