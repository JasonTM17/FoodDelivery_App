import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/screens/address_management_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';

Widget _wrap(AddressFormDialog dialog) {
  return MaterialApp(
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: Scaffold(body: dialog),
  );
}

void main() {
  testWidgets('keeps the dialog open and enables retry after a save failure', (
    tester,
  ) async {
    var calls = 0;
    await tester.pumpWidget(
      _wrap(
        AddressFormDialog(
          title: 'Add address',
          saveFailureMessage: 'Could not save the address',
          onSave: (_, _, _) async {
            calls++;
            throw StateError('network unavailable');
          },
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField), '1 Test Street');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(calls, 1);
    expect(find.text('Could not save the address'), findsOneWidget);
    expect(find.text('Save'), findsOneWidget);
    expect(
      tester.widget<ElevatedButton>(find.byType(ElevatedButton)).onPressed,
      isNotNull,
    );
  });

  testWidgets('disables cancel and repeated saves while saving', (
    tester,
  ) async {
    final saveCompleter = Completer<String?>();
    var calls = 0;
    await tester.pumpWidget(
      _wrap(
        AddressFormDialog(
          title: 'Add address',
          saveFailureMessage: 'Could not save the address',
          onSave: (_, _, _) {
            calls++;
            return saveCompleter.future;
          },
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField), '1 Test Street');
    await tester.tap(find.text('Save'));
    await tester.pump();
    await tester.tap(find.byType(ElevatedButton));
    await tester.pump();

    expect(calls, 1);
    expect(
      tester
          .widget<TextButton>(find.widgetWithText(TextButton, 'Cancel'))
          .onPressed,
      isNull,
    );

    saveCompleter.complete('Could not save the address');
    await tester.pumpAndSettle();
    expect(find.text('Could not save the address'), findsOneWidget);
  });
}
