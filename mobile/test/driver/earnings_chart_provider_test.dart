import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/earnings_chart_provider.dart';

void main() {
  group('EarningsSummary.fromJson', () {
    test('parses chart-ready payout ledger summary', () {
      final summary = EarningsSummary.fromJson({
        'period': '7d',
        'totalVnd': 70000,
        'tripCount': 3,
        'avgPerTrip': 23333,
        'byDay': [
          {'date': '2026-07-02', 'amount': 40000, 'tripCount': 2},
          {'date': '2026-07-03', 'amount': '30000', 'tripCount': '1'},
        ],
      });

      expect(summary.period, '7d');
      expect(summary.totalVnd, 70000);
      expect(summary.tripCount, 3);
      expect(summary.avgPerTrip, 23333);
      expect(summary.byDay, hasLength(2));
      expect(summary.byDay.last.amount, 30000);
      expect(summary.byDay.last.tripCount, 1);
    });

    test('defaults missing totals to zero without local generated data', () {
      final summary = EarningsSummary.fromJson({});

      expect(summary.totalVnd, 0);
      expect(summary.tripCount, 0);
      expect(summary.avgPerTrip, 0);
      expect(summary.byDay, isEmpty);
    });
  });

  group('EarningsPeriodApiValue', () {
    test('maps periods to backend query values', () {
      expect(EarningsPeriod.sevenDays.apiValue, '7d');
      expect(EarningsPeriod.thirtyDays.apiValue, '30d');
      expect(EarningsPeriod.ninetyDays.apiValue, '90d');
    });
  });
}
