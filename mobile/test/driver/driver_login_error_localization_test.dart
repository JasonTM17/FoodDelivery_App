import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';
import 'package:foodflow_customer/driver/screens/login_screen.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';

class _LoginFailureNotifier extends DriverNotifier {
  _LoginFailureNotifier(String errorCode) {
    state = DriverState(error: errorCode);
  }
}

Widget _app(Locale locale) {
  return ProviderScope(
    overrides: [
      driverProvider.overrideWith(
        (ref) => _LoginFailureNotifier('DRIVER_AUTH_INVALID_CREDENTIALS'),
      ),
    ],
    child: MaterialApp(
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const LoginScreen(),
    ),
  );
}

void main() {
  testWidgets('localizes stable driver login failure codes in every locale', (
    tester,
  ) async {
    const expectations = {
      'vi': 'Email hoặc mật khẩu không đúng.',
      'en': 'Email or password is incorrect.',
      'ja': 'メールアドレスまたはパスワードが正しくありません。',
    };

    for (final entry in expectations.entries) {
      await tester.pumpWidget(_app(Locale(entry.key)));
      await tester.pumpAndSettle();

      expect(find.text(entry.value), findsOneWidget);
      expect(find.text('DRIVER_AUTH_INVALID_CREDENTIALS'), findsNothing);
    }
  });
}
