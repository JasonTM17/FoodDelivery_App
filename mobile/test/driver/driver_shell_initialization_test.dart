import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/main_driver.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';

class _CountingDriverNotifier extends DriverNotifier {
  int todayStatsRequests = 0;
  int recentOrdersRequests = 0;
  int activeOrderRequests = 0;

  @override
  Future<void> fetchTodayStats() async {
    todayStatsRequests += 1;
  }

  @override
  Future<void> fetchRecentOrders() async {
    recentOrdersRequests += 1;
  }

  @override
  Future<void> fetchActiveOrder() async {
    activeOrderRequests += 1;
  }
}

Widget _app(_CountingDriverNotifier notifier) {
  return ProviderScope(
    overrides: [driverProvider.overrideWith((ref) => notifier)],
    child: MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const DriverShell(),
    ),
  );
}

void main() {
  testWidgets('loads each driver dashboard resource exactly once on startup', (
    tester,
  ) async {
    final notifier = _CountingDriverNotifier();

    await tester.pumpWidget(_app(notifier));
    await tester.pump();
    await tester.pump();

    expect(notifier.todayStatsRequests, 1);
    expect(notifier.recentOrdersRequests, 1);
    expect(notifier.activeOrderRequests, 1);
  });
}
