import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/providers/tracking_provider.dart';

void main() {
  group('resolveTrackingRoutePolyline', () {
    test('uses persisted route until a realtime route update arrives', () {
      const tracking = TrackingState();

      expect(
        resolveTrackingRoutePolyline(tracking, 'persisted-route'),
        'persisted-route',
      );
    });

    test('lets realtime null clear a stale persisted route', () {
      const tracking = TrackingState(routeUpdateReceived: true);

      expect(resolveTrackingRoutePolyline(tracking, 'stale-route'), isNull);
    });

    test('uses realtime route after a realtime route update arrives', () {
      const tracking = TrackingState(
        routePolyline: 'live-route',
        routeUpdateReceived: true,
      );

      expect(
        resolveTrackingRoutePolyline(tracking, 'persisted-route'),
        'live-route',
      );
    });
  });
}
