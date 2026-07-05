import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/shared/providers/locale_provider.dart';

// NOTE: These tests require `flutter gen-l10n` to be run first.
// Run: cd mobile && flutter pub get && flutter gen-l10n

Future<void> _pumpLocaleFrame(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 16));
}

void _setLocaleForWidgetTest(WidgetRef ref, Locale locale) {
  // LocaleNotifier updates state synchronously before persisting to storage.
  // Widget tests only need the render update, not the platform storage write.
  unawaited(ref.read(localeProvider.notifier).setLocale(locale));
}

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

      await container
          .read(localeProvider.notifier)
          .setLocale(const Locale('en'));

      expect(container.read(localeProvider).languageCode, equals('en'));
    });

    test('setLocale updates state to Japanese', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container
          .read(localeProvider.notifier)
          .setLocale(const Locale('ja'));

      expect(container.read(localeProvider).languageCode, equals('ja'));
    });
  });

  group('rendered strings change on locale switch', () {
    testWidgets('defaults to Vietnamese — loginTitle is Đăng nhập', (
      tester,
    ) async {
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
                      AppLocalizations.of(ctx).loginTitle,
                      key: const Key('login_title'),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);

      expect(find.text('Đăng nhập'), findsOneWidget);
    });

    testWidgets('switching to English updates loginTitle to Login', (
      tester,
    ) async {
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
                      AppLocalizations.of(ctx).loginTitle,
                      key: const Key('login_title'),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);

      // Initial locale is Vietnamese
      expect(find.text('Đăng nhập'), findsOneWidget);

      // Switch locale to English
      _setLocaleForWidgetTest(capturedRef, const Locale('en'));
      await _pumpLocaleFrame(tester);

      expect(find.text('Login'), findsOneWidget);
      expect(find.text('Đăng nhập'), findsNothing);
    });

    testWidgets('switching to Japanese updates loginTitle to ログイン', (
      tester,
    ) async {
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
                      AppLocalizations.of(ctx).loginTitle,
                      key: const Key('login_title'),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);

      _setLocaleForWidgetTest(capturedRef, const Locale('ja'));
      await _pumpLocaleFrame(tester);

      expect(find.text('ログイン'), findsOneWidget);
    });
  });

  group('batch-2 keys — cart/checkout/review/driver_nav', () {
    testWidgets('cartTitle switches across all 3 locales', (tester) async {
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
                    builder: (ctx) => Text(AppLocalizations.of(ctx).cartTitle),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);
      expect(find.text('Giỏ hàng'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('en'));
      await _pumpLocaleFrame(tester);
      expect(find.text('Cart'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('ja'));
      await _pumpLocaleFrame(tester);
      expect(find.text('カート'), findsOneWidget);
    });

    testWidgets('reviewTitle switches across all 3 locales', (tester) async {
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
                    builder: (ctx) =>
                        Text(AppLocalizations.of(ctx).reviewTitle),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);
      expect(find.text('Đánh giá đơn hàng'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('en'));
      await _pumpLocaleFrame(tester);
      expect(find.text('Rate your order'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('ja'));
      await _pumpLocaleFrame(tester);
      expect(find.text('注文を評価する'), findsOneWidget);
    });

    testWidgets('driverNavTitle switches across all 3 locales', (tester) async {
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
                    builder: (ctx) =>
                        Text(AppLocalizations.of(ctx).driverNavTitle),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);
      expect(find.text('Giao hàng'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('en'));
      await _pumpLocaleFrame(tester);
      expect(find.text('Delivery'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('ja'));
      await _pumpLocaleFrame(tester);
      expect(find.text('配達'), findsOneWidget);
    });
  });

  group('batch-4 driver pickup/completion keys', () {
    testWidgets('driverPickupTitle switches across all 3 locales', (
      tester,
    ) async {
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
                    builder: (ctx) =>
                        Text(AppLocalizations.of(ctx).driverPickupTitle),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);
      expect(find.text('Xác nhận lấy hàng'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('en'));
      await _pumpLocaleFrame(tester);
      expect(find.text('Confirm pickup'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('ja'));
      await _pumpLocaleFrame(tester);
      expect(find.text('受け取り確認'), findsOneWidget);
    });

    testWidgets('driverDeliveryTripEarnings switches across all 3 locales', (
      tester,
    ) async {
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
                      AppLocalizations.of(ctx).driverDeliveryTripEarnings,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);
      expect(find.text('Thu nhập chuyến này'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('en'));
      await _pumpLocaleFrame(tester);
      expect(find.text('Trip earnings'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('ja'));
      await _pumpLocaleFrame(tester);
      expect(find.text('この配達の収益'), findsOneWidget);
    });

    testWidgets('driverDispatchAccept switches across all 3 locales', (
      tester,
    ) async {
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
                    builder: (ctx) =>
                        Text(AppLocalizations.of(ctx).driverDispatchAccept),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);
      expect(find.text('Nhận đơn'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('en'));
      await _pumpLocaleFrame(tester);
      expect(find.text('Accept order'), findsOneWidget);

      _setLocaleForWidgetTest(capturedRef, const Locale('ja'));
      await _pumpLocaleFrame(tester);
      expect(find.text('注文を承諾'), findsOneWidget);
    });
  });

  group('batch-4 address map validation keys', () {
    test('address location errors exist in vi/en/ja', () {
      final vi = lookupAppLocalizations(const Locale('vi'));
      final en = lookupAppLocalizations(const Locale('en'));
      final ja = lookupAppLocalizations(const Locale('ja'));

      expect(vi.addressLocationRequired, isNotEmpty);
      expect(vi.addressLocationInvalid, isNotEmpty);
      expect(
        en.addressLocationRequired,
        'Please choose a valid location on the map.',
      );
      expect(
        en.addressLocationInvalid,
        'The address location is invalid. Please choose it again on the map.',
      );
      expect(ja.addressLocationRequired, isNotEmpty);
      expect(ja.addressLocationInvalid, isNotEmpty);
    });
  });

  group('placeholder keys', () {
    testWidgets('cartPromoApplied renders with code placeholder', (
      tester,
    ) async {
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
                      AppLocalizations.of(ctx).cartPromoApplied('SAVE20'),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);
      expect(find.text('Đã áp dụng mã SAVE20'), findsOneWidget);
    });

    testWidgets('orderHistoryTabActive renders with count placeholder', (
      tester,
    ) async {
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
                    builder: (ctx) =>
                        Text(AppLocalizations.of(ctx).orderHistoryTabActive(3)),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await _pumpLocaleFrame(tester);
      expect(find.text('Đang hoạt động (3)'), findsOneWidget);
    });
  });
}
