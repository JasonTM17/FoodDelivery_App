import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:foodflow_customer/driver/providers/tip_provider.dart';
import 'package:foodflow_customer/driver/screens/settings_screen.dart';
import 'package:foodflow_customer/driver/screens/tip_adjustment_screen.dart';
import 'package:foodflow_customer/driver/widgets/tip_amount_picker.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';

Widget _app(
  Locale locale,
  Widget child, {
  ProviderContainer? container,
  List<Override> overrides = const [],
}) {
  final app = MaterialApp(
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: ThemeData.dark(),
    home: child,
  );
  if (container != null) {
    return UncontrolledProviderScope(container: container, child: app);
  }
  return ProviderScope(overrides: overrides, child: app);
}

class _ErrorTipNotifier extends TipNotifier {
  _ErrorTipNotifier() {
    state = const TipState(error: 'DRIVER_TIP_SUBMIT_FAILED');
  }
}

void main() {
  testWidgets('settings section headings follow vi/en/ja locale', (
    tester,
  ) async {
    const copies = {
      'vi': ['Cài đặt', 'Thông báo', 'Chung'],
      'en': ['Settings', 'Notifications', 'General'],
      'ja': ['設定', '通知', '一般'],
    };

    for (final entry in copies.entries) {
      await tester.pumpWidget(_app(Locale(entry.key), const SettingsScreen()));
      await tester.pumpAndSettle();

      for (final label in entry.value) {
        expect(find.text(label), findsOneWidget);
      }
    }
  });

  testWidgets('tip choices are accessible localized currency controls', (
    tester,
  ) async {
    for (final locale in const [Locale('vi'), Locale('en'), Locale('ja')]) {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      await tester.pumpWidget(
        _app(
          locale,
          const Scaffold(body: TipAmountPicker()),
          container: container,
        ),
      );
      await tester.pumpAndSettle();

      final chips = find.byType(ChoiceChip);
      expect(chips, findsNWidgets(4));
      for (final chip in tester.widgetList<ChoiceChip>(chips)) {
        final label = chip.label as Text;
        expect(label.data, contains('₫'));
        expect(label.data, isNot(contains('Kđ')));
      }
      expect(tester.getSize(chips.first).height, greaterThanOrEqualTo(48));

      await tester.tap(chips.first);
      await tester.pump();
      expect(container.read(tipProvider).suggestedAmount, 5000);
    }
  });

  testWidgets('clearing custom tip input clears the effective amount', (
    tester,
  ) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    await tester.pumpWidget(
      _app(
        const Locale('en'),
        const Scaffold(body: TipAmountPicker()),
        container: container,
      ),
    );

    final field = find.byType(TextField);
    await tester.enterText(field, '25000');
    await tester.pump();
    expect(container.read(tipProvider).effectiveAmount, 25000);

    await tester.enterText(field, '');
    await tester.pump();
    expect(container.read(tipProvider).effectiveAmount, 0);
  });

  testWidgets('tip API error is localized without exposing error code', (
    tester,
  ) async {
    const copies = {
      'vi': 'Không thể lưu báo cáo tip. Vui lòng thử lại.',
      'en': 'Could not save the tip report. Please try again.',
      'ja': 'チップ報告を保存できませんでした。もう一度お試しください。',
    };

    for (final entry in copies.entries) {
      await tester.pumpWidget(
        _app(
          Locale(entry.key),
          const TipAdjustmentScreen(
            tripId: 'trip-1',
            restaurantName: 'FoodFlow Kitchen',
            customerName: 'Customer',
          ),
          overrides: [tipProvider.overrideWith((ref) => _ErrorTipNotifier())],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text(entry.value), findsOneWidget);
      expect(find.text('DRIVER_TIP_SUBMIT_FAILED'), findsNothing);
    }
  });
}
