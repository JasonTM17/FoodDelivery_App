import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:foodflow_customer/driver/utils/history_date_formatter.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/shared/utils/currency_formatter.dart';

class _FormatterProbe extends StatelessWidget {
  const _FormatterProbe({required this.now, required this.value});

  final DateTime now;
  final DateTime value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(formatVnd(context, 12345), key: const Key('currency')),
        Text(formatSignedVnd(context, 12345), key: const Key('positive')),
        Text(formatSignedVnd(context, -12345), key: const Key('negative')),
        Text(
          formatDriverHistoryDateTime(context, value, now: now),
          key: const Key('history-date'),
        ),
      ],
    );
  }
}

Widget _app(Locale locale, {required DateTime now, required DateTime value}) {
  return MaterialApp(
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: Scaffold(
      body: _FormatterProbe(now: now, value: value),
    ),
  );
}

String _text(WidgetTester tester, Key key) {
  return tester.widget<Text>(find.byKey(key)).data!;
}

void main() {
  testWidgets(
    'currency formatting is localized and keeps explicit VND symbol',
    (tester) async {
      for (final locale in const [Locale('vi'), Locale('en'), Locale('ja')]) {
        await tester.pumpWidget(
          _app(
            locale,
            now: DateTime(2026, 7, 11, 12),
            value: DateTime(2026, 7, 11, 10),
          ),
        );
        await tester.pumpAndSettle();

        final currency = _text(tester, const Key('currency'));
        expect(currency, contains('₫'));
        expect(currency, isNot(contains('12345đ')));
        expect(_text(tester, const Key('positive')), startsWith('+'));
        expect(_text(tester, const Key('negative')), startsWith('-'));
      }
    },
  );

  testWidgets('history formatter uses calendar days across midnight', (
    tester,
  ) async {
    const yesterdayPrefixes = {
      'vi': 'Hôm qua,',
      'en': 'Yesterday,',
      'ja': '昨日 ',
    };
    final now = DateTime(2026, 7, 11, 0, 5);
    final tenMinutesEarlier = DateTime(2026, 7, 10, 23, 55);

    for (final entry in yesterdayPrefixes.entries) {
      await tester.pumpWidget(
        _app(Locale(entry.key), now: now, value: tenMinutesEarlier),
      );
      await tester.pumpAndSettle();

      expect(_text(tester, const Key('history-date')), startsWith(entry.value));
    }
  });

  testWidgets(
    'history formatter uses localized absolute dates for older trips',
    (tester) async {
      const relativeLabels = [
        'Today',
        'Yesterday',
        'Hôm nay',
        'Hôm qua',
        '今日',
        '昨日',
      ];

      for (final locale in const [Locale('vi'), Locale('en'), Locale('ja')]) {
        await tester.pumpWidget(
          _app(
            locale,
            now: DateTime(2026, 7, 11, 12),
            value: DateTime(2026, 7, 1, 10),
          ),
        );
        await tester.pumpAndSettle();

        final formatted = _text(tester, const Key('history-date'));
        expect(formatted, contains('2026'));
        for (final label in relativeLabels) {
          expect(formatted, isNot(contains(label)));
        }
      }
    },
  );
}
