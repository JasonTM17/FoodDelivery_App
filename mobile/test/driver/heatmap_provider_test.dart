import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/heatmap_provider.dart';

void main() {
  group('HeatmapPoint.fromJson', () {
    test('parses backend heatmap rows', () {
      final point = HeatmapPoint.fromJson({
        'lat': 10.7769,
        'lng': 106.7009,
        'demandLevel': 2,
        'orderCount': 12,
        'avgPayout': 32500,
      });

      expect(point.lat, 10.7769);
      expect(point.lng, 106.7009);
      expect(point.demandLevel, 2);
      expect(point.orderCount, 12);
      expect(point.avgPayout, 32500);
    });

    test(
      'clamps invalid demand levels instead of trusting payload blindly',
      () {
        final point = HeatmapPoint.fromJson({
          'lat': '10.7769',
          'lng': '106.7009',
          'demandLevel': 99,
          'orderCount': '4',
          'avgPayout': '21000',
        });

        expect(point.demandLevel, 2);
        expect(point.orderCount, 4);
        expect(point.avgPayout, 21000);
      },
    );

    test('rejects missing coordinates instead of defaulting to zero', () {
      expect(
        () => HeatmapPoint.fromJson({
          'demandLevel': 1,
          'orderCount': 4,
          'avgPayout': 21000,
        }),
        throwsA(isA<FormatException>()),
      );
    });

    test('rejects coordinates outside the Vietnam delivery map', () {
      expect(
        () => HeatmapPoint.fromJson({
          'lat': 13.7563,
          'lng': 100.5018,
          'demandLevel': 1,
          'orderCount': 4,
          'avgPayout': 21000,
        }),
        throwsA(isA<FormatException>()),
      );
    });
  });

  group('HeatmapNotifier', () {
    test('does not load demand with invalid driver location', () async {
      final notifier = HeatmapNotifier();

      await notifier.loadHeatmap(0, 0);

      expect(notifier.state.points, isEmpty);
      expect(notifier.state.error, 'DRIVER_HEATMAP_LOCATION_REQUIRED');
      expect(notifier.state.selectedWindow, 'now');
      expect(notifier.state.isLoading, isFalse);
    });
  });
}
