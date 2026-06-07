import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/screens/onboarding_vehicle_screen.dart';
import 'package:foodflow_customer/driver/screens/onboarding_agreement_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

GoRouter _vehicleRouter() => GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(path: '/', builder: (_, __) => const OnboardingVehicleScreen()),
        GoRoute(path: '/onboarding-documents', builder: (_, __) => const Scaffold()),
      ],
    );

GoRouter _agreementRouter() => GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(path: '/', builder: (_, __) => const OnboardingAgreementScreen()),
        GoRoute(path: '/kyc', builder: (_, __) => const Scaffold()),
      ],
    );

Widget _wrap(GoRouter router) {
  return ProviderScope(
    child: MaterialApp.router(
      routerConfig: router,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
    ),
  );
}

// ---------------------------------------------------------------------------
// OnboardingVehicleScreen tests
// ---------------------------------------------------------------------------

void main() {
  group('OnboardingVehicleScreen', () {
    testWidgets('renders vehicle type options', (tester) async {
      await tester.pumpWidget(_wrap(_vehicleRouter()));
      await tester.pumpAndSettle();

      // AppBar title present
      expect(find.text('Thông tin phương tiện'), findsOneWidget);

      // All 3 vehicle type cards rendered
      expect(find.text('Xe đạp'), findsOneWidget);
      expect(find.text('Xe máy'), findsOneWidget);
      expect(find.text('Ô tô'), findsOneWidget);
    });

    testWidgets('shows validation error when plate is empty', (tester) async {
      await tester.pumpWidget(_wrap(_vehicleRouter()));
      await tester.pumpAndSettle();

      // Tap Next without entering plate
      await tester.tap(find.text('Tiếp theo'));
      await tester.pumpAndSettle();

      expect(find.text('Vui lòng nhập biển số'), findsOneWidget);
    });

    testWidgets('selects vehicle type on tap', (tester) async {
      await tester.pumpWidget(_wrap(_vehicleRouter()));
      await tester.pumpAndSettle();

      // Tap bicycle option
      await tester.tap(find.text('Xe đạp'));
      await tester.pumpAndSettle();

      // Check mark should appear for bicycle
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
    });

    testWidgets('navigates to documents screen on valid form', (tester) async {
      await tester.pumpWidget(_wrap(_vehicleRouter()));
      await tester.pumpAndSettle();

      // Enter plate number
      await tester.enterText(
        find.byType(TextFormField),
        '51A-12345',
      );
      await tester.tap(find.text('Tiếp theo'));
      await tester.pumpAndSettle();

      // Should navigate away (Scaffold rendered for /onboarding-documents)
      expect(find.byType(Scaffold), findsOneWidget);
    });
  });

  // ---------------------------------------------------------------------------
  // OnboardingAgreementScreen tests
  // ---------------------------------------------------------------------------

  group('OnboardingAgreementScreen', () {
    testWidgets('renders title and scrollable terms', (tester) async {
      await tester.pumpWidget(_wrap(_agreementRouter()));
      await tester.pumpAndSettle();

      expect(find.text('Điều khoản tài xế'), findsOneWidget);
      expect(find.byType(SingleChildScrollView), findsWidgets);
    });

    testWidgets('submit button disabled when checkbox unchecked', (tester) async {
      await tester.pumpWidget(_wrap(_agreementRouter()));
      await tester.pumpAndSettle();

      final btn = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(btn.onPressed, isNull);
    });

    testWidgets('submit button enabled after checking agreement', (tester) async {
      await tester.pumpWidget(_wrap(_agreementRouter()));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(Checkbox));
      await tester.pumpAndSettle();

      final btn = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(btn.onPressed, isNotNull);
    });

    testWidgets('shows note info box', (tester) async {
      await tester.pumpWidget(_wrap(_agreementRouter()));
      await tester.pumpAndSettle();

      expect(
        find.text(
          'Hồ sơ xét duyệt trong 24-48h. Bạn sẽ nhận thông báo khi được duyệt.',
        ),
        findsOneWidget,
      );
    });
  });
}
