import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_notifications_provider.dart';
import 'package:foodflow_customer/driver/screens/notifications_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';

class _FakeDriverNotificationsNotifier extends DriverNotificationsNotifier {
  final DriverNotificationsState preset;

  _FakeDriverNotificationsNotifier(this.preset);

  @override
  Future<void> fetchNotifications() async {
    state = preset;
  }
}

Widget _buildScreen(DriverNotificationsState state) {
  return ProviderScope(
    overrides: [
      driverNotificationsProvider.overrideWith(
        (ref) => _FakeDriverNotificationsNotifier(state),
      ),
    ],
    child: const MaterialApp(
      locale: Locale('vi'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: NotificationsScreen(),
    ),
  );
}

void main() {
  testWidgets('groups canonical order events into the orders tab', (
    tester,
  ) async {
    final notification = DriverNotification(
      id: 'order-1',
      type: 'order_update',
      title: 'Canonical driver order event',
      body: 'An order changed status',
      createdAt: DateTime(2026, 1, 1),
      isRead: false,
    );

    await tester.pumpWidget(
      _buildScreen(DriverNotificationsState(notifications: [notification])),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Đơn hàng'));
    await tester.pumpAndSettle();
    expect(find.text('Canonical driver order event'), findsOneWidget);
    expect(find.byIcon(Icons.shopping_bag_outlined), findsOneWidget);
  });

  testWidgets('groups namespaced promotion events into the rewards tab', (
    tester,
  ) async {
    final notification = DriverNotification(
      id: 'promotion-1',
      type: 'promotion.broadcast',
      title: 'Canonical driver reward event',
      body: 'A reward was published',
      createdAt: DateTime(2026, 1, 1),
      isRead: false,
    );

    await tester.pumpWidget(
      _buildScreen(DriverNotificationsState(notifications: [notification])),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Thưởng'));
    await tester.pumpAndSettle();
    expect(find.text('Canonical driver reward event'), findsOneWidget);
    expect(find.byIcon(Icons.star_outline), findsOneWidget);
  });
}
