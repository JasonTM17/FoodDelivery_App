import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/screens/order_tracking_screen.dart';
import 'package:foodflow_customer/shared/providers/tracking_provider.dart';

void main() {
  group('orderTrackingInitialCameraTarget', () {
    test(
      'does not default to a hardcoded city without backend coordinates',
      () {
        final target = orderTrackingInitialCameraTarget(
          null,
          const TrackingState(),
        );

        expect(target, isNull);
      },
    );

    test('uses the realtime driver location when it is valid', () {
      final target = orderTrackingInitialCameraTarget(
        null,
        const TrackingState(driverLatitude: 10.7769, driverLongitude: 106.7009),
      );

      expect(target, isNotNull);
      expect(target!.latitude, closeTo(10.7769, 0.00001));
      expect(target.longitude, closeTo(106.7009, 0.00001));
    });

    test('ignores invalid realtime driver coordinates', () {
      final target = orderTrackingInitialCameraTarget(
        null,
        const TrackingState(driverLatitude: 0, driverLongitude: 0),
      );

      expect(target, isNull);
    });
  });
}
