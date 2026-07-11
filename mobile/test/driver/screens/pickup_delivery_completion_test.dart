import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/models/driver_flow_args.dart';
import 'package:foodflow_customer/driver/screens/delivery_complete_screen.dart';
import 'package:foodflow_customer/driver/screens/pickup_confirmation_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';

Widget _wrap(Widget child) => MaterialApp(
  theme: ThemeData.dark(),
  locale: const Locale('vi'),
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  home: child,
);

void main() {
  group('PickupConfirmationScreen', () {
    testWidgets('renders route-supplied pickup items and restaurant note', (
      tester,
    ) async {
      const args = PickupConfirmationArgs(
        orderId: 'order-123',
        items: [
          DriverPickupItem(name: 'Pho Ga', quantity: 2),
          DriverPickupItem(name: 'Spring Roll', quantity: 1),
        ],
        restaurantNote: 'No peanuts',
        deliveryFee: 18000,
      );

      await tester.pumpWidget(
        _wrap(const PickupConfirmationScreen(args: args)),
      );

      expect(find.text('Pho Ga (x2)'), findsOneWidget);
      expect(find.text('Spring Roll (x1)'), findsOneWidget);
      expect(find.text('No peanuts'), findsOneWidget);

      final disabledButton = tester.widget<ElevatedButton>(
        find.byKey(const Key('pickup-confirmation-complete-button')),
      );
      expect(disabledButton.onPressed, isNull);

      await tester.tap(find.text('Pho Ga (x2)'));
      await tester.tap(find.text('Spring Roll (x1)'));
      await tester.pump();

      final enabledButton = tester.widget<ElevatedButton>(
        find.byKey(const Key('pickup-confirmation-complete-button')),
      );
      expect(enabledButton.onPressed, isNotNull);
    });

    testWidgets(
      'shows an explicit missing-order state when no args are passed',
      (tester) async {
        await tester.pumpWidget(_wrap(const PickupConfirmationScreen()));

        expect(
          find.byKey(const Key('pickup-confirmation-missing-state')),
          findsOneWidget,
        );
        expect(
          find.byKey(const Key('pickup-confirmation-complete-button')),
          findsNothing,
        );
      },
    );
  });

  group('DeliveryCompleteScreen', () {
    testWidgets('renders earnings from route-supplied completion args', (
      tester,
    ) async {
      const args = DeliveryCompleteArgs(
        orderId: 'order-123',
        deliveryFee: 18000,
        bonus: 5000,
      );

      await tester.pumpWidget(_wrap(const DeliveryCompleteScreen(args: args)));
      await tester.pump(const Duration(milliseconds: 1000));

      expect(
        find.byKey(const Key('delivery-complete-earnings-card')),
        findsOneWidget,
      );
      expect(find.textContaining('23.000'), findsOneWidget);
      expect(find.textContaining('18.000'), findsOneWidget);
      expect(find.textContaining('5.000'), findsOneWidget);
      expect(find.textContaining('₫'), findsNWidgets(3));
    });

    testWidgets('does not invent a bonus when completion args omit it', (
      tester,
    ) async {
      const args = DeliveryCompleteArgs(
        orderId: 'order-123',
        deliveryFee: 18000,
      );

      await tester.pumpWidget(_wrap(const DeliveryCompleteScreen(args: args)));
      await tester.pump(const Duration(milliseconds: 1000));

      expect(find.textContaining('18.000'), findsWidgets);
      expect(find.textContaining('5.000'), findsNothing);
      expect(find.textContaining('₫'), findsWidgets);
    });

    testWidgets(
      'shows an explicit missing-earnings state when no args are passed',
      (tester) async {
        await tester.pumpWidget(_wrap(const DeliveryCompleteScreen()));
        await tester.pump(const Duration(milliseconds: 1000));

        expect(
          find.byKey(const Key('delivery-complete-missing-state')),
          findsOneWidget,
        );
        expect(
          find.byKey(const Key('delivery-complete-earnings-card')),
          findsNothing,
        );
      },
    );
  });
}
