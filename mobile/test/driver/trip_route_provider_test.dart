import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/trip_route_provider.dart';

void main() {
  group('TripRouteDetail.fromJson', () {
    test('parses backend route telemetry', () {
      final route = TripRouteDetail.fromJson({
        'tripId': 'order-1',
        'points': [
          {
            'lat': 10.7769,
            'lng': 106.7009,
            'timestamp': '2026-07-03T08:00:00.000Z',
            'source': 'telemetry',
            'timestampEstimated': false,
          },
          {
            'lat': '10.7869',
            'lng': '106.7109',
            'timestamp': '2026-07-03T08:10:00.000Z',
            'source': 'telemetry',
            'timestampEstimated': false,
          },
        ],
        'segments': [
          {
            'distanceKm': '1.2',
            'durationSeconds': '240',
            'instruction': 'Head to pickup',
            'startIndex': 0,
            'endIndex': 1,
          },
        ],
        'routeSource': 'telemetry',
        'timestampsEstimated': false,
        'totalDistanceKm': '3.5',
        'totalDurationSeconds': 600,
        'avgSpeedKmh': 21,
        'payout': 25000,
      });

      expect(route.tripId, 'order-1');
      expect(route.points, hasLength(2));
      expect(route.points.last.lat, 10.7869);
      expect(route.points.last.source, 'telemetry');
      expect(route.points.last.timestampEstimated, isFalse);
      expect(route.segments.single.instruction, 'Head to pickup');
      expect(route.routeSource, 'telemetry');
      expect(route.timestampsEstimated, isFalse);
      expect(route.totalDistanceKm, 3.5);
      expect(route.totalDurationSeconds, 600);
      expect(route.avgSpeedKmh, 21);
      expect(route.payout, 25000);
    });

    test(
      'accepts explicit no-route backend responses without local points',
      () {
        final route = TripRouteDetail.fromJson({
          'tripId': 'order-2',
          'points': [],
          'segments': [],
          'routeSource': 'none',
          'timestampsEstimated': false,
          'totalDistanceKm': 0,
          'totalDurationSeconds': 0,
          'avgSpeedKmh': 0,
          'payout': 0,
        });

        expect(route.tripId, 'order-2');
        expect(route.points, isEmpty);
        expect(route.segments, isEmpty);
        expect(route.routeSource, 'none');
        expect(route.timestampsEstimated, isFalse);
        expect(route.totalDistanceKm, 0);
        expect(route.totalDurationSeconds, 0);
        expect(route.avgSpeedKmh, 0);
        expect(route.payout, 0);
      },
    );

    test(
      'rejects missing route contract fields instead of faking no-route data',
      () {
        expect(
          () => TripRouteDetail.fromJson({}),
          throwsA(isA<FormatException>()),
        );
      },
    );

    test('rejects invalid route points instead of drawing partial paths', () {
      expect(
        () => TripRouteDetail.fromJson({
          'tripId': 'order-1',
          'points': [
            {
              'lat': 10.7769,
              'lng': 106.7009,
              'timestamp': '2026-07-03T08:00:00.000Z',
              'source': 'telemetry',
              'timestampEstimated': false,
            },
            {
              'lat': 13.7563,
              'lng': 100.5018,
              'timestamp': '2026-07-03T08:10:00.000Z',
              'source': 'telemetry',
              'timestampEstimated': false,
            },
          ],
          'segments': [],
          'routeSource': 'telemetry',
          'timestampsEstimated': false,
          'totalDistanceKm': 3.5,
          'totalDurationSeconds': 600,
          'avgSpeedKmh': 21,
          'payout': 25000,
        }),
        throwsA(isA<FormatException>()),
      );
    });

    test(
      'parses persisted geometry metadata without treating it as telemetry',
      () {
        final route = TripRouteDetail.fromJson({
          'tripId': 'order-1',
          'points': [
            {
              'lat': 10.7769,
              'lng': 106.7009,
              'timestamp': '2026-07-03T08:00:00.000Z',
              'source': 'persisted_geometry',
              'timestampEstimated': true,
            },
          ],
          'segments': [],
          'routeSource': 'persisted_geometry',
          'timestampsEstimated': true,
          'totalDistanceKm': 1.2,
          'totalDurationSeconds': 240,
          'avgSpeedKmh': 18,
          'payout': 25000,
        });

        expect(route.routeSource, 'persisted_geometry');
        expect(route.timestampsEstimated, isTrue);
        expect(route.points.single.source, 'persisted_geometry');
        expect(route.points.single.timestampEstimated, isTrue);
      },
    );

    test('RoutePoint rejects invalid coordinates explicitly', () {
      expect(
        () => RoutePoint.fromJson({
          'lat': 0,
          'lng': 0,
          'timestamp': '2026-07-03T08:00:00.000Z',
          'source': 'telemetry',
          'timestampEstimated': false,
        }),
        throwsA(isA<FormatException>()),
      );
    });
  });
}
