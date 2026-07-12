import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/heatmap_provider.dart';
import 'package:foodflow_customer/driver/widgets/heatmap_canvas.dart';

void main() {
  group('heatmap camera target', () {
    test('uses the real driver location when GPS coordinates are valid', () {
      final target = heatmapInitialCameraTarget(
        centerLat: 10.7769,
        centerLng: 106.7009,
        points: const [_demandPoint],
      );

      expect(target, isNotNull);
      expect(target!.latitude, 10.7769);
      expect(target.longitude, 106.7009);
    });

    test('uses backend demand data when driver GPS is unavailable', () {
      final target = heatmapInitialCameraTarget(
        centerLat: 0,
        centerLng: 0,
        points: const [_demandPoint],
      );

      expect(target, isNotNull);
      expect(target!.latitude, 10.8);
      expect(target.longitude, 106.65);
    });

    test('does not invent a Ho Chi Minh City fallback location', () {
      final target = heatmapInitialCameraTarget(
        centerLat: 0,
        centerLng: 0,
        points: const [],
      );

      expect(target, isNull);
    });
  });

  group('heatmap driver marker', () {
    test('does not expose driver location marker without valid GPS', () {
      expect(heatmapDriverLocation(0, 0), isNull);
    });
  });
}

const _demandPoint = HeatmapPoint(
  lat: 10.8,
  lng: 106.65,
  demandLevel: 2,
  orderCount: 8,
  avgPayout: 32000,
);
