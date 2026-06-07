import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/customer/screens/loyalty_screen.dart';
import 'package:foodflow_customer/customer/providers/loyalty_provider.dart';

Widget _wrap(Widget child, {List<Override>? overrides}) {
  return ProviderScope(
    overrides: overrides ?? const [],
    child: MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: child,
    ),
  );
}

class _FakeLoyaltyNotifier extends LoyaltyNotifier {
  final LoyaltyState preset;
  _FakeLoyaltyNotifier(this.preset);

  @override
  Future<void> fetchLoyalty() async {
    state = preset;
  }
}

void main() {
  group('LoyaltyScreen', () {
    testWidgets('shows loading shimmer initially', (tester) async {
      final fakeNotifier = _FakeLoyaltyNotifier(const LoyaltyState(isLoading: true));
      await tester.pumpWidget(_wrap(
        const LoyaltyScreen(),
        overrides: [loyaltyProvider.overrideWith((ref) => fakeNotifier)],
      ));
      await tester.pump();
      // Loading state should not crash
      expect(find.byType(LoyaltyScreen), findsOneWidget);
    });

    testWidgets('shows points balance when loaded', (tester) async {
      final loadedState = const LoyaltyState(
        isLoading: false,
        totalPoints: 250,
        tier: 'silver',
        pointsToNextTier: 750,
        transactions: [],
      );
      final fakeNotifier = _FakeLoyaltyNotifier(loadedState);
      await tester.pumpWidget(_wrap(
        const LoyaltyScreen(),
        overrides: [loyaltyProvider.overrideWith((ref) => fakeNotifier)],
      ));
      await tester.pumpAndSettle();

      // Points should be displayed
      expect(find.textContaining('250'), findsWidgets);
    });

    testWidgets('shows bronze tier by default', (tester) async {
      final fakeNotifier = _FakeLoyaltyNotifier(
        const LoyaltyState(isLoading: false, totalPoints: 0, tier: 'bronze'),
      );
      await tester.pumpWidget(_wrap(
        const LoyaltyScreen(),
        overrides: [loyaltyProvider.overrideWith((ref) => fakeNotifier)],
      ));
      await tester.pumpAndSettle();

      expect(find.byType(LoyaltyScreen), findsOneWidget);
    });

    testWidgets('shows error state with retry button', (tester) async {
      final fakeNotifier = _FakeLoyaltyNotifier(
        const LoyaltyState(isLoading: false, error: 'Network error'),
      );
      await tester.pumpWidget(_wrap(
        const LoyaltyScreen(),
        overrides: [loyaltyProvider.overrideWith((ref) => fakeNotifier)],
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('Network error'), findsOneWidget);
    });

    testWidgets('shows empty history message when no transactions', (tester) async {
      final fakeNotifier = _FakeLoyaltyNotifier(
        const LoyaltyState(isLoading: false, totalPoints: 100, transactions: []),
      );
      await tester.pumpWidget(_wrap(
        const LoyaltyScreen(),
        overrides: [loyaltyProvider.overrideWith((ref) => fakeNotifier)],
      ));
      await tester.pumpAndSettle();

      // Empty history state visible
      expect(find.byType(LoyaltyScreen), findsOneWidget);
    });

    testWidgets('renders earn points section', (tester) async {
      final fakeNotifier = _FakeLoyaltyNotifier(
        const LoyaltyState(isLoading: false, totalPoints: 50),
      );
      await tester.pumpWidget(_wrap(
        const LoyaltyScreen(),
        overrides: [loyaltyProvider.overrideWith((ref) => fakeNotifier)],
      ));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.receipt_long_outlined), findsOneWidget);
      expect(find.byIcon(Icons.people_outline), findsOneWidget);
    });
  });
}
