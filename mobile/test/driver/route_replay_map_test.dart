import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/widgets/route_replay_map.dart';

void main() {
  group('routeReplayInitialCameraTarget', () {
    test(
      'does not fall back to a hardcoded city when route data is missing',
      () {
        final target = routeReplayInitialCameraTarget(
          points: const [],
          fromLat: 0,
          fromLng: 0,
          toLat: 0,
          toLng: 0,
        );

        expect(target, isNull);
      },
    );

    test('uses the first valid route point from backend telemetry', () {
      final target = routeReplayInitialCameraTarget(
        points: const [
          RoutePointData(lat: 0, lng: 0),
          RoutePointData(lat: 10.7769, lng: 106.7009),
        ],
        fromLat: 0,
        fromLng: 0,
        toLat: 0,
        toLng: 0,
      );

      expect(target, isNotNull);
      expect(target!.latitude, closeTo(10.7769, 0.00001));
      expect(target.longitude, closeTo(106.7009, 0.00001));
    });

    test('uses a valid endpoint only when no route point is available', () {
      final target = routeReplayInitialCameraTarget(
        points: const [RoutePointData(lat: 0, lng: 0)],
        fromLat: 10.7801,
        fromLng: 106.6999,
        toLat: 10.7769,
        toLng: 106.7009,
      );

      expect(target, isNotNull);
      expect(target!.latitude, closeTo(10.7801, 0.00001));
      expect(target.longitude, closeTo(106.6999, 0.00001));
    });
  });
}
