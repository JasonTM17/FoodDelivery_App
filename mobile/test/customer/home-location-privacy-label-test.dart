import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/screens/home_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';

void main() {
  test(
    'customer home never renders precise coordinates as its location label',
    () {
      for (final locale in const [Locale('vi'), Locale('en'), Locale('ja')]) {
        final localizations = lookupAppLocalizations(locale);
        final label = customerHomeLocationLabel(
          localizations,
          hasLocation: true,
        );

        expect(label, localizations.currentLocationLabel);
        expect(label, isNot(matches(RegExp(r'-?\d+\.\d+\s*,\s*-?\d+\.\d+'))));
      }
    },
  );

  test('customer home retains the locating state before GPS resolves', () {
    final localizations = lookupAppLocalizations(const Locale('vi'));

    expect(
      customerHomeLocationLabel(localizations, hasLocation: false),
      localizations.locating,
    );
  });
}
