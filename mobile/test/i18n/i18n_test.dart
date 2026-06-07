import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/shared/providers/locale_provider.dart';

// NOTE: These tests require `flutter gen-l10n` to be run first.
// Run: cd mobile && flutter pub get && flutter gen-l10n

void main() {
  group('locale_provider state', () {
    test('defaults to Vietnamese', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final locale = container.read(localeProvider);
      expect(locale.languageCode, equals('vi'));
    });

    test('setLocale updates state to English', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(localeProvider.notifier).setLocale(const Locale('en'));

      expect(container.read(localeProvider).languageCode, equals('en'));
    });

    test('setLocale updates state to Japanese', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(localeProvider.notifier).setLocale(const Locale('ja'));

      expect(container.read(localeProvider).languageCode, equals('ja'));
    });
  });

  group('rendered strings change on locale switch', () {
    testWidgets('defaults to Vietnamese — loginTitle is Đăng nhập', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: Consumer(
            builder: (context, ref, _) {
              final locale = ref.watch(localeProvider);
              return MaterialApp(
                locale: locale,
                localizationsDelegates: AppLocalizations.localizationsDelegates,
                supportedLocales: AppLocalizations.supportedLocales,
                home: Scaffold(
                  body: Builder(
                    builder: (ctx) => Text(
                      AppLocalizations.of(ctx)!.loginTitle,
                      key: const Key('login_title'),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Đăng nhập'), findsOneWidget);
    });

    testWidgets('switching to English updates loginTitle to Login', (tester) async {
      late WidgetRef capturedRef;

      await tester.pumpWidget(
        ProviderScope(
          child: Consumer(
            builder: (context, ref, _) {
              capturedRef = ref;
              final locale = ref.watch(localeProvider);
              return MaterialApp(
                locale: locale,
                localizationsDelegates: AppLocalizations.localizationsDelegates,
                supportedLocales: AppLocalizations.supportedLocales,
                home: Scaffold(
                  body: Builder(
                    builder: (ctx) => Text(
                      AppLocalizations.of(ctx)!.loginTitle,
                      key: const Key('login_title'),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Initial locale is Vietnamese
      expect(find.text('Đăng nhập'), findsOneWidget);

      // Switch locale to English
      await capturedRef
          .read(localeProvider.notifier)
          .setLocale(const Locale('en'));
      await tester.pumpAndSettle();

      expect(find.text('Login'), findsOneWidget);
      expect(find.text('Đăng nhập'), findsNothing);
    });

    testWidgets('switching to Japanese updates loginTitle to ログイン', (tester) async {
      late WidgetRef capturedRef;

      await tester.pumpWidget(
        ProviderScope(
          child: Consumer(
            builder: (context, ref, _) {
              capturedRef = ref;
              final locale = ref.watch(localeProvider);
              return MaterialApp(
                locale: locale,
                localizationsDelegates: AppLocalizations.localizationsDelegates,
                supportedLocales: AppLocalizations.supportedLocales,
                home: Scaffold(
                  body: Builder(
                    builder: (ctx) => Text(
                      AppLocalizations.of(ctx)!.loginTitle,
                      key: const Key('login_title'),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      await capturedRef
          .read(localeProvider.notifier)
          .setLocale(const Locale('ja'));
      await tester.pumpAndSettle();

      expect(find.text('ログイン'), findsOneWidget);
    });
  });
}
