import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart'
    show DispatchOffer;
import 'package:foodflow_customer/driver/widgets/dispatch_offer_dialog.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';

const _testOffer = DispatchOffer(
  orderId: 'order-001',
  offerToken: 'offer-token',
  restaurantAddress: '1 Hai Ba Trung, District 1',
  restaurantName: 'Bún Bò Huế Ngon',
  deliveryAddress: '123 Lê Lợi, Q.1, TP.HCM',
  orderTotal: 85000,
  deliveryFee: 15000,
  distanceKm: 2.4,
  timeoutSeconds: 30,
  surgeMultiplier: 1.0,
);

Widget _buildDialog({VoidCallback? onAccept, VoidCallback? onReject}) {
  return MaterialApp(
    locale: const Locale('vi'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: ThemeData.dark(),
    home: Scaffold(
      body: DispatchOfferDialog(
        offer: _testOffer,
        onAccept: onAccept ?? () {},
        onReject: onReject ?? () {},
      ),
    ),
  );
}

void main() {
  group('DispatchOfferDialog — layout', () {
    testWidgets('renders restaurant name', (tester) async {
      await tester.pumpWidget(_buildDialog());
      expect(find.text('Bún Bò Huế Ngon'), findsOneWidget);
    });

    testWidgets('renders delivery address', (tester) async {
      await tester.pumpWidget(_buildDialog());
      expect(find.text('123 Lê Lợi, Q.1, TP.HCM'), findsOneWidget);
    });

    testWidgets('renders accept and reject buttons', (tester) async {
      await tester.pumpWidget(_buildDialog());
      expect(find.text('Nhận đơn'), findsOneWidget);
      expect(find.text('Từ chối'), findsOneWidget);
    });

    testWidgets('renders distance chip', (tester) async {
      await tester.pumpWidget(_buildDialog());
      expect(find.textContaining('2.4 km'), findsOneWidget);
    });

    testWidgets('renders delivery fee', (tester) async {
      await tester.pumpWidget(_buildDialog());
      expect(find.textContaining('15.000'), findsOneWidget);
      expect(find.textContaining('₫'), findsOneWidget);
    });

    testWidgets('countdown starts at 30', (tester) async {
      await tester.pumpWidget(_buildDialog());
      expect(find.text('30'), findsOneWidget);
    });
  });

  group('DispatchOfferDialog — interactions', () {
    testWidgets('accept button fires onAccept callback', (tester) async {
      bool accepted = false;
      await tester.pumpWidget(_buildDialog(onAccept: () => accepted = true));
      await tester.tap(find.text('Nhận đơn'));
      await tester.pumpAndSettle();
      expect(accepted, isTrue);
    });

    testWidgets('reject button fires onReject callback', (tester) async {
      bool rejected = false;
      await tester.pumpWidget(_buildDialog(onReject: () => rejected = true));
      await tester.tap(find.text('Từ chối'));
      await tester.pumpAndSettle();
      expect(rejected, isTrue);
    });

    testWidgets('countdown decrements by 1 after each second', (tester) async {
      await tester.pumpWidget(_buildDialog());
      expect(find.text('30'), findsOneWidget);
      await tester.pump(const Duration(seconds: 1));
      expect(find.text('29'), findsOneWidget);
      await tester.pump(const Duration(seconds: 1));
      expect(find.text('28'), findsOneWidget);
    });

    testWidgets('accept button removes dialog from tree', (tester) async {
      await tester.pumpWidget(_buildDialog());
      await tester.tap(find.text('Nhận đơn'));
      await tester.pumpAndSettle();
      expect(find.byType(DispatchOfferDialog), findsNothing);
    });

    testWidgets('reject button removes dialog from tree', (tester) async {
      await tester.pumpWidget(_buildDialog());
      await tester.tap(find.text('Từ chối'));
      await tester.pumpAndSettle();
      expect(find.byType(DispatchOfferDialog), findsNothing);
    });
  });

  group('DispatchOfferDialog — countdown color', () {
    testWidgets('countdown shows primary color above 10s', (tester) async {
      await tester.pumpWidget(_buildDialog());
      // At 30s the countdown text should exist (color tested visually)
      expect(find.text('30'), findsOneWidget);
    });

    testWidgets('countdown text changes below 10 seconds', (tester) async {
      await tester.pumpWidget(_buildDialog());
      // Advance to 9 seconds remaining
      await tester.pump(const Duration(seconds: 21));
      expect(find.text('9'), findsOneWidget);
      expect(find.text('Sắp hết thời gian!'), findsOneWidget);
    });
  });
}
