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
  });
}
