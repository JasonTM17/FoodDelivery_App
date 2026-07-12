import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/router/route_names.dart';
import 'package:foodflow_customer/customer/screens/splash_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/shared/providers/auth_provider.dart';
import 'package:go_router/go_router.dart';

class _TestAuthNotifier extends AuthNotifier {
  _TestAuthNotifier(this.authenticated);

  final bool authenticated;

  @override
  Future<void> checkAuthStatus() async {
    state = AuthState(isAuthenticated: authenticated, isInitialized: true);
  }
}

Widget _app({required bool authenticated, required Locale locale}) {
  final router = GoRouter(
    initialLocation: Routes.splash,
    routes: [
      GoRoute(path: Routes.splash, builder: (_, __) => const SplashScreen()),
      GoRoute(
        path: Routes.login,
        builder: (_, __) => const Text('LOGIN_DESTINATION'),
      ),
      GoRoute(
        path: Routes.home,
        builder: (_, __) => const Text('HOME_DESTINATION'),
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      authProvider.overrideWith((_) => _TestAuthNotifier(authenticated)),
    ],
    child: MaterialApp.router(
      routerConfig: router,
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    ),
  );
}

void main() {
  testWidgets(
    'uses localized copy and routes unauthenticated users with GoRouter',
    (tester) async {
      await tester.pumpWidget(
        _app(authenticated: false, locale: const Locale('en')),
      );

      expect(
        find.text('Order your favorite food, delivered fast to your door'),
        findsOneWidget,
      );

      await tester.pump(const Duration(seconds: 2));
      await tester.pumpAndSettle();

      expect(find.text('LOGIN_DESTINATION'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('routes authenticated users to the customer home', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(authenticated: true, locale: const Locale('ja')),
    );

    expect(find.text('お気に入りのグルメを注文、素早くお届け'), findsOneWidget);

    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();

    expect(find.text('HOME_DESTINATION'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
