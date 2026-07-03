import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';
import 'package:foodflow_customer/driver/screens/home_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

// ---------------------------------------------------------------------------
// Fake notifier — subclasses DriverNotifier so the override type matches.
// Async data-fetch methods are no-ops to avoid real network/platform calls.
// ---------------------------------------------------------------------------

class _FakeDriverNotifier extends DriverNotifier {
  final DriverState _initial;

  _FakeDriverNotifier(this._initial);

  void initState() {
    state = _initial;
  }

  // Suppress all network/platform calls from initState hooks in the screen.
  @override
  Future<void> fetchTodayStats() async {}

  @override
  Future<void> fetchRecentOrders() async {}

  @override
  Future<void> fetchActiveOrder() async {}

  @override
  void startDispatchOfferListener() {}

  @override
  Future<void> goOnlineWithGps() async {}

  @override
  Future<void> goOffline() async {}
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

GoRouter _router() => GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
    GoRoute(path: '/delivery-flow', builder: (_, __) => const Scaffold()),
    GoRoute(path: '/notifications', builder: (_, __) => const Scaffold()),
  ],
);

Widget _buildHome(DriverState state) {
  return ProviderScope(
    overrides: [
      driverProvider.overrideWith(
        (ref) => _FakeDriverNotifier(state)..state = state,
      ),
    ],
    child: MaterialApp.router(
      routerConfig: _router(),
      locale: const Locale('vi'),
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('HomeScreen — empty state', () {
    testWidgets('renders without error', (tester) async {
      await tester.pumpWidget(
        _buildHome(const DriverState(isAuthenticated: true)),
      );
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
    });

    testWidgets('shows FoodFlow Driver app bar title', (tester) async {
      await tester.pumpWidget(
        _buildHome(const DriverState(isAuthenticated: true)),
      );
      await tester.pumpAndSettle();
      expect(find.text('FoodFlow Driver'), findsOneWidget);
    });

    testWidgets('shows Hôm nay section header', (tester) async {
      await tester.pumpWidget(
        _buildHome(const DriverState(isAuthenticated: true)),
      );
      await tester.pumpAndSettle();
      expect(find.text('Hôm nay'), findsOneWidget);
    });

    testWidgets('shows empty-orders message when recentOrders is empty', (
      tester,
    ) async {
      await tester.pumpWidget(
        _buildHome(const DriverState(isAuthenticated: true, recentOrders: [])),
      );
      await tester.pumpAndSettle();
      expect(find.text('Chưa có đơn hàng nào'), findsOneWidget);
    });
  });

  group('HomeScreen — online/offline toggle', () {
    testWidgets('shows "Đang trực tuyến" when isOnline=true', (tester) async {
      await tester.pumpWidget(
        _buildHome(const DriverState(isAuthenticated: true, isOnline: true)),
      );
      await tester.pumpAndSettle();
      expect(find.text('Đang trực tuyến'), findsOneWidget);
    });

    testWidgets('shows "Đang ngoại tuyến" when isOnline=false', (tester) async {
      await tester.pumpWidget(
        _buildHome(const DriverState(isAuthenticated: true, isOnline: false)),
      );
      await tester.pumpAndSettle();
      expect(find.text('Đang ngoại tuyến'), findsOneWidget);
    });
  });

  group('HomeScreen — today stats', () {
    testWidgets('displays earnings from todayStats', (tester) async {
      final state = DriverState(
        isAuthenticated: true,
        todayStats: DriverTodayStats.fromJson({
          'totalEarnings': 120000,
          'totalOrders': 5,
          'onlineMinutes': 90,
          'rating': 4.8,
        }),
      );
      await tester.pumpWidget(_buildHome(state));
      await tester.pumpAndSettle();
      expect(find.textContaining('120000'), findsOneWidget);
    });

    testWidgets('displays order count from todayStats', (tester) async {
      final state = DriverState(
        isAuthenticated: true,
        todayStats: DriverTodayStats.fromJson({
          'totalEarnings': 50000,
          'totalOrders': 3,
          'onlineMinutes': 45,
          'rating': 5.0,
        }),
      );
      await tester.pumpWidget(_buildHome(state));
      await tester.pumpAndSettle();
      expect(find.text('3'), findsWidgets);
    });
  });
}
