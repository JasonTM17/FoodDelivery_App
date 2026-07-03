import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/incentives_provider.dart';
import 'package:foodflow_customer/driver/screens/incentives_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const _testIncentives = DriverIncentives(
  active: [
    DriverIncentive(
      id: 'active-1',
      title: 'Giao 20 đơn trong tuần',
      rewardAmount: 120000,
      progress: 12,
      target: 20,
      endsAt: '2026-07-10T00:00:00.000Z',
      completed: false,
    ),
    DriverIncentive(
      id: 'active-2',
      title: 'Giờ cao điểm tối nay',
      rewardAmount: 50000,
      progress: 5,
      target: 4,
      endsAt: '2026-07-03T23:00:00.000Z',
      completed: false,
    ),
  ],
  completed: [
    DriverIncentive(
      id: 'completed-1',
      title: 'Giao 50 đơn tháng 5',
      rewardAmount: 300000,
      progress: 50,
      target: 50,
      endsAt: '2026-05-31T23:59:59.000Z',
      completed: true,
    ),
  ],
);

Widget _wrap() {
  final router = GoRouter(
    initialLocation: '/',
    routes: [GoRoute(path: '/', builder: (_, __) => const IncentivesScreen())],
  );
  return ProviderScope(
    overrides: [
      driverIncentivesProvider.overrideWith((ref) async => _testIncentives),
    ],
    child: MaterialApp.router(
      routerConfig: router,
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
// IncentivesScreen tests
// ---------------------------------------------------------------------------

void main() {
  group('IncentivesScreen', () {
    testWidgets('renders title and tab bar', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('Ưu đãi'), findsOneWidget);
      expect(find.text('Đang diễn ra'), findsOneWidget);
      expect(find.text('Hoàn thành'), findsOneWidget);
    });

    testWidgets('active tab shows stub incentive cards', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      // First stub incentive title
      expect(find.text('Giao 20 đơn trong tuần'), findsOneWidget);

      // Progress indicator should be visible
      expect(find.byType(LinearProgressIndicator), findsWidgets);
    });

    testWidgets('active tab shows reward and expiry labels', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.textContaining('Thưởng:'), findsWidgets);
      expect(find.textContaining('Hết hạn:'), findsWidgets);
    });

    testWidgets('completed tab shows completed incentives', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      // Switch to Completed tab
      await tester.tap(find.text('Hoàn thành'));
      await tester.pumpAndSettle();

      expect(find.text('Giao 50 đơn tháng 5'), findsOneWidget);
      // Completed badge tick
      expect(find.text('✓'), findsOneWidget);
    });

    testWidgets('progress values clamped between 0 and 1', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      final indicators = tester
          .widgetList<LinearProgressIndicator>(
            find.byType(LinearProgressIndicator),
          )
          .toList();

      for (final indicator in indicators) {
        expect(indicator.value, isNotNull);
        expect(indicator.value!, inInclusiveRange(0.0, 1.0));
      }
    });
  });
}
