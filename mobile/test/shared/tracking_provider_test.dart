import 'package:api_client/api_client.dart';
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

  group('mergeTrackingSnapshot', () {
    test('hydrates initial ETA, route phase, route and driver location', () {
      const state = TrackingState(currentOrderId: 'order-1');
      const snapshot = TrackingResponse(
        orderId: 'order-1',
        status: 'delivering',
        etaMinutes: 12,
        routePolyline: 'encoded-route',
        routePhase: 'dropoff',
        driverLocation: DriverLocation(
          lat: 10.7769,
          lng: 106.7009,
          lastUpdated: '2026-07-05T01:02:03Z',
        ),
      );

      final merged = mergeTrackingSnapshot(state, snapshot);

      expect(merged.etaMinutes, 12);
      expect(merged.etaSource, 'snapshot');
      expect(merged.etaDegraded, isFalse);
      expect(merged.routePolyline, 'encoded-route');
      expect(merged.routePhase, 'dropoff');
      expect(merged.routeUpdateReceived, isTrue);
      expect(merged.driverLatitude, 10.7769);
      expect(merged.driverLongitude, 106.7009);
      expect(merged.driverLocations, hasLength(1));
      expect(
        merged.driverLocations.single['timestamp'],
        '2026-07-05T01:02:03Z',
      );
    });

    test('lets a snapshot without route clear stale order geometry', () {
      const state = TrackingState(currentOrderId: 'order-1');
      const snapshot = TrackingResponse(
        orderId: 'order-1',
        status: 'driver_assigned',
        etaMinutes: null,
        routePolyline: null,
        routePhase: 'pickup',
      );

      final merged = mergeTrackingSnapshot(state, snapshot);

      expect(merged.routeUpdateReceived, isTrue);
      expect(resolveTrackingRoutePolyline(merged, 'stale-order-route'), isNull);
      expect(merged.etaMinutes, isNull);
      expect(merged.etaDegraded, isTrue);
    });

    test('ignores invalid driver coordinates from the snapshot', () {
      const state = TrackingState(currentOrderId: 'order-1');
      const snapshot = TrackingResponse(
        orderId: 'order-1',
        status: 'delivering',
        etaMinutes: 5,
        routePolyline: 'encoded-route',
        routePhase: 'dropoff',
        driverLocation: DriverLocation(
          lat: 51.5072,
          lng: -0.1276,
          lastUpdated: '2026-07-05T01:02:03Z',
        ),
      );

      final merged = mergeTrackingSnapshot(state, snapshot);

      expect(merged.driverLatitude, isNull);
      expect(merged.driverLongitude, isNull);
      expect(merged.driverLocations, isEmpty);
    });

    test(
      'clears a stale driver marker when the snapshot coordinates are invalid',
      () {
        const state = TrackingState(
          currentOrderId: 'order-1',
          driverLatitude: 10.7769,
          driverLongitude: 106.7009,
          driverLocations: [
            {
              'lat': 10.7769,
              'lng': 106.7009,
              'timestamp': '2026-07-05T01:00:00Z',
            },
          ],
        );
        const snapshot = TrackingResponse(
          orderId: 'order-1',
          status: 'delivering',
          etaMinutes: 5,
          routePolyline: 'encoded-route',
          routePhase: 'dropoff',
          driverLocation: DriverLocation(
            lat: 0,
            lng: 0,
            lastUpdated: '2026-07-05T01:02:03Z',
          ),
        );

        final merged = mergeTrackingSnapshot(state, snapshot);

        expect(merged.driverLatitude, isNull);
        expect(merged.driverLongitude, isNull);
        expect(merged.driverLocations, hasLength(1));
      },
    );
  });
}
