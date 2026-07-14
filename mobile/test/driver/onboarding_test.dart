import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/models/driver_onboarding_draft.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';
import 'package:foodflow_customer/driver/screens/onboarding_agreement_screen.dart';
import 'package:foodflow_customer/driver/screens/onboarding_vehicle_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

GoRouter _vehicleRouter() => GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const OnboardingVehicleScreen()),
    GoRoute(
      path: '/onboarding-documents',
      builder: (_, state) {
        final draft = state.extra! as DriverOnboardingDraft;
        return Scaffold(
          body: Text(
            '${draft.licenseNumber}|${draft.vehicleType}|${draft.vehiclePlate}',
          ),
        );
      },
    ),
  ],
);

GoRouter _agreementRouter() => GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const OnboardingAgreementScreen()),
    GoRoute(path: '/onboarding-vehicle', builder: (_, __) => const Scaffold()),
  ],
);

Widget _wrap(GoRouter router) {
  return ProviderScope(
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

void main() {
  group('OnboardingVehicleScreen', () {
    testWidgets('renders localized vehicle and license fields', (tester) async {
      await tester.pumpWidget(_wrap(_vehicleRouter()));
      await tester.pumpAndSettle();

      expect(find.text('Thông tin phương tiện'), findsOneWidget);
      expect(find.text('Xe đạp'), findsOneWidget);
      expect(find.text('Xe máy'), findsOneWidget);
      expect(find.text('Ô tô'), findsOneWidget);
      expect(find.text('Số giấy phép lái xe'), findsOneWidget);
      expect(find.text('Biển số xe'), findsOneWidget);
    });

    testWidgets('requires both license number and plate', (tester) async {
      await tester.pumpWidget(_wrap(_vehicleRouter()));
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.text('Tiếp theo'));
      await tester.tap(find.text('Tiếp theo'));
      await tester.pumpAndSettle();

      expect(find.text('Vui lòng nhập số giấy phép lái xe'), findsOneWidget);
      expect(find.text('Vui lòng nhập biển số'), findsOneWidget);
    });

    testWidgets('passes normalized typed draft to the next route', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(_vehicleRouter()));
      await tester.pumpAndSettle();

      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), ' ab-12345 ');
      await tester.enterText(fields.at(1), ' 51a-123.45 ');
      await tester.ensureVisible(find.text('Tiếp theo'));
      await tester.tap(find.text('Tiếp theo'));
      await tester.pumpAndSettle();

      expect(find.text('AB-12345|motorbike|51A-123.45'), findsOneWidget);
    });

    testWidgets('uses the backend bicycle enum instead of bike', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(_vehicleRouter()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Xe đạp'));
      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), 'AB-12345');
      await tester.enterText(fields.at(1), 'BIKE-001');
      await tester.ensureVisible(find.text('Tiếp theo'));
      await tester.tap(find.text('Tiếp theo'));
      await tester.pumpAndSettle();

      expect(find.text('AB-12345|bicycle|BIKE-001'), findsOneWidget);
    });
  });

  group('OnboardingAgreementScreen', () {
    testWidgets('renders localized terms and review note', (tester) async {
      await tester.pumpWidget(_wrap(_agreementRouter()));
      await tester.pumpAndSettle();

      expect(find.text('Điều khoản tài xế'), findsOneWidget);
      expect(find.byType(SingleChildScrollView), findsWidgets);
      expect(
        find.text(
          'Hồ sơ xét duyệt trong 24-48h. Bạn sẽ nhận thông báo khi được duyệt.',
        ),
        findsOneWidget,
      );
    });

    testWidgets('requires explicit agreement before continuing', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(_agreementRouter()));
      await tester.pumpAndSettle();

      var button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull);

      await tester.tap(find.byType(Checkbox));
      await tester.pumpAndSettle();

      button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNotNull);
      expect(find.text('Đồng ý và tiếp tục'), findsOneWidget);
    });

    test('verified driver skips redundant KYC onboarding', () {
      expect(
        driverRouteAfterTerms(const DriverState(isVerified: true)),
        '/home',
      );
      expect(
        driverRouteAfterTerms(const DriverState(isVerified: false)),
        '/onboarding-vehicle',
      );
      expect(
        driverRouteAfterTerms(
          const DriverState(kycStatus: DriverKycStatus.pending),
        ),
        '/home',
      );
    });
  });
}
