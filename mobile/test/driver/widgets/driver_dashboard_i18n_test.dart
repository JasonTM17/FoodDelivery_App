import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:foodflow_customer/driver/providers/earnings_chart_provider.dart';
import 'package:foodflow_customer/driver/widgets/date_range_filter.dart';
import 'package:foodflow_customer/driver/widgets/delivery_step_indicator.dart';
import 'package:foodflow_customer/driver/widgets/driver_bottom_nav.dart';
import 'package:foodflow_customer/driver/widgets/driver_rating_distribution.dart';
import 'package:foodflow_customer/driver/widgets/earnings_daily_bar_chart.dart';
import 'package:foodflow_customer/driver/widgets/peak_hour_progress.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';

Widget _localizedApp(Locale locale, Widget child) {
  return MaterialApp(
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: ThemeData.dark(),
    home: Scaffold(
      body: SingleChildScrollView(child: SizedBox(width: 760, child: child)),
    ),
  );
}

Widget _localizedNavApp(Locale locale) {
  return MaterialApp(
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: ThemeData.dark(),
    home: Scaffold(
      body: const SizedBox.shrink(),
      bottomNavigationBar: DriverBottomNav(currentIndex: 0, onTap: (_) {}),
    ),
  );
}

void main() {
  const copies =
      <
        String,
        ({
          List<String> nav,
          List<String> dates,
          List<String> steps,
          String peak,
          String earnings,
          String reviews,
        })
      >{
        'vi': (
          nav: ['Trang chủ', 'Thu nhập', 'Lịch sử giao hàng', 'Hồ sơ'],
          dates: ['Hôm nay', '7 ngày qua', '30 ngày qua', 'Tùy chỉnh'],
          steps: ['Đến NH', 'Lấy hàng', 'Giao hàng', 'Hoàn tất'],
          peak: 'Giờ cao điểm',
          earnings: 'Thu nhập hàng ngày',
          reviews: '12 đánh giá',
        ),
        'en': (
          nav: ['Home', 'Earnings', 'Delivery history', 'Profile'],
          dates: ['Today', 'Last 7 days', 'Last 30 days', 'Custom'],
          steps: ['Restaurant', 'Pick up', 'Deliver', 'Complete'],
          peak: 'Peak hours',
          earnings: 'Daily earnings',
          reviews: '12 reviews',
        ),
        'ja': (
          nav: ['ホーム', '収益', '配達履歴', 'プロフィール'],
          dates: ['今日', '過去7日間', '過去30日間', '期間指定'],
          steps: ['店舗へ', '受け取り', '配達', '完了'],
          peak: 'ピーク時間',
          earnings: '日別収益',
          reviews: '12件の評価',
        ),
      };

  testWidgets('driver navigation follows the active vi/en/ja locale', (
    tester,
  ) async {
    for (final entry in copies.entries) {
      await tester.pumpWidget(_localizedNavApp(Locale(entry.key)));
      await tester.pumpAndSettle();

      for (final label in entry.value.nav) {
        expect(find.text(label), findsOneWidget);
      }
    }
  });

  testWidgets('driver dashboard widgets follow the active vi/en/ja locale', (
    tester,
  ) async {
    final days = [
      DailyEarning(date: DateTime(2026, 7, 10), amount: 85000, tripCount: 2),
      DailyEarning(date: DateTime(2026, 7, 11), amount: 125000, tripCount: 3),
    ];

    for (final entry in copies.entries) {
      await tester.pumpWidget(
        _localizedApp(
          Locale(entry.key),
          Column(
            children: [
              const DateRangeFilter(),
              const DeliveryStepIndicator(currentStep: 1),
              const PeakHourProgress(
                completedOrders: 2,
                targetOrders: 5,
                bonusAmount: 50000,
              ),
              EarningsDailyBarChart(byDay: days),
              const DriverRatingDistribution(
                average: 4.8,
                totalReviews: 12,
                distribution: {5: 10, 4: 2},
              ),
            ],
          ),
        ),
      );
      await tester.pumpAndSettle();

      for (final label in [...entry.value.dates, ...entry.value.steps]) {
        expect(find.text(label), findsOneWidget);
      }
      expect(find.text(entry.value.peak), findsOneWidget);
      expect(find.text(entry.value.earnings), findsOneWidget);
      expect(find.text(entry.value.reviews), findsOneWidget);
    }

    expect(find.text('Giờ cao điểm'), findsNothing);
    expect(find.text('Thu nhập hàng ngày'), findsNothing);
  });

  testWidgets(
    'seven-day filter spans seven calendar days and clear is tappable',
    (tester) async {
      DateTime? from;
      DateTime? to;

      await tester.pumpWidget(
        _localizedApp(
          const Locale('en'),
          DateRangeFilter(
            onFromDateChanged: (value) => from = value,
            onToDateChanged: (value) => to = value,
          ),
        ),
      );
      await tester.tap(find.text('Last 7 days'));
      await tester.pump();

      expect(from, isNotNull);
      expect(to, isNotNull);
      expect(
        DateUtils.dateOnly(to!).difference(DateUtils.dateOnly(from!)).inDays,
        6,
      );

      var cleared = false;
      await tester.pumpWidget(
        _localizedApp(
          const Locale('en'),
          DateRangeFilter(
            fromDate: DateTime(2026, 7, 5),
            toDate: DateTime(2026, 7, 11),
            onClear: () => cleared = true,
          ),
        ),
      );
      await tester.pumpAndSettle();

      final clearButton = find.widgetWithText(TextButton, 'Clear');
      expect(clearButton, findsOneWidget);
      final size = tester.getSize(clearButton);
      expect(size.width, greaterThanOrEqualTo(48));
      expect(size.height, greaterThanOrEqualTo(48));

      await tester.tap(clearButton);
      expect(cleared, isTrue);
    },
  );
}
