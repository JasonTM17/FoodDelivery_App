import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/l10n/app_localizations_en.dart';
import 'package:foodflow_customer/l10n/app_localizations_ja.dart';
import 'package:foodflow_customer/l10n/app_localizations_vi.dart';
import 'package:foodflow_customer/shared/utils/order_status_labels.dart';
import 'package:foodflow_customer/shared/widgets/order_status_badge.dart';

const backendOrderStatuses = <String>[
  'created',
  'pending_payment',
  'paid',
  'restaurant_pending',
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'driver_assigned',
  'driver_arriving_restaurant',
  'picked_up',
  'delivering',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
];

void main() {
  test('localizes every backend order status without leaking enum keys', () {
    final localizations = <AppLocalizations>[
      AppLocalizationsVi(),
      AppLocalizationsEn(),
      AppLocalizationsJa(),
    ];

    for (final l10n in localizations) {
      for (final status in backendOrderStatuses) {
        final label = localizedOrderStatus(l10n, status);
        expect(label, isNotEmpty, reason: '${l10n.localeName}: $status');
        expect(
          label,
          isNot(contains('_')),
          reason: '${l10n.localeName}: $status',
        );
        expect(label, isNot(status), reason: '${l10n.localeName}: $status');
      }
    }
  });

  test('uses a localized safe fallback for an unknown status', () {
    expect(
      localizedOrderStatus(AppLocalizationsVi(), 'future_backend_status'),
      'Đang cập nhật',
    );
  });

  testWidgets('order badge renders restaurant_pending as Vietnamese copy', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        locale: Locale('vi'),
        localizationsDelegates: [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(body: OrderStatusBadge(status: 'restaurant_pending')),
      ),
    );

    expect(find.text('Chờ nhà hàng'), findsOneWidget);
    expect(find.text('restaurant_pending'), findsNothing);
  });
}
