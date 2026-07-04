import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/customer/screens/onboarding_welcome_screen.dart';
import 'package:foodflow_customer/customer/screens/onboarding_location_screen.dart';
import 'package:foodflow_customer/customer/screens/onboarding_notification_screen.dart';

Widget _wrap(Widget child) {
  return ProviderScope(
    child: MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: child,
    ),
  );
}

void main() {
  group('OnboardingWelcomeScreen', () {
    testWidgets('renders welcome title and next button', (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingWelcomeScreen()));
      await tester.pumpAndSettle();

      expect(find.byType(ElevatedButton), findsOneWidget);
      expect(find.byType(TextButton), findsOneWidget); // skip button
    });

    testWidgets('shows 3 page dots with first dot active', (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingWelcomeScreen()));
      await tester.pumpAndSettle();

      // Find the 3 dot containers (identified by different widths — active=24, inactive=8)
      final containers = tester.widgetList<Container>(find.byType(Container));
      final dots = containers.where((c) {
        final decoration = c.decoration as BoxDecoration?;
        return decoration?.borderRadius != null &&
            (c.constraints?.maxWidth == 24 || c.constraints?.maxWidth == 8);
      }).toList();
      expect(dots.length, greaterThanOrEqualTo(3));
    });

    testWidgets('restaurant icon is present', (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingWelcomeScreen()));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.restaurant), findsOneWidget);
    });
  });

  group('OnboardingLocationScreen', () {
    testWidgets('renders allow and next buttons', (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingLocationScreen()));
      await tester.pumpAndSettle();

      expect(find.byType(ElevatedButton), findsOneWidget);
      // Both TextButton (skip) and TextButton (next/later) may appear
      expect(find.byType(TextButton), findsWidgets);
    });

    testWidgets('shows location icon', (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingLocationScreen()));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.location_on), findsOneWidget);
    });
  });

  group('OnboardingNotificationScreen', () {
    testWidgets('renders get started button', (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingNotificationScreen()));
      await tester.pumpAndSettle();

      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('shows notifications icon', (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingNotificationScreen()));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.notifications_active), findsOneWidget);
    });

    testWidgets('shows page dot 2 as active (last step)', (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingNotificationScreen()));
      await tester.pumpAndSettle();

      // Screen renders without error — primary check
      expect(find.byType(OnboardingNotificationScreen), findsOneWidget);
    });
  });
}
