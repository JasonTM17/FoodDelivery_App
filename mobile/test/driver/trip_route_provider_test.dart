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
          },
          {
            'lat': '10.7869',
            'lng': '106.7109',
            'timestamp': '2026-07-03T08:10:00.000Z',
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
        'totalDistanceKm': '3.5',
        'totalDurationSeconds': 600,
        'avgSpeedKmh': 21,
        'payout': 25000,
      });

      expect(route.tripId, 'order-1');
      expect(route.points, hasLength(2));
      expect(route.points.last.lat, 10.7869);
      expect(route.segments.single.instruction, 'Head to pickup');
      expect(route.totalDistanceKm, 3.5);
      expect(route.totalDurationSeconds, 600);
      expect(route.avgSpeedKmh, 21);
      expect(route.payout, 25000);
    });

    test(
      'defaults missing route data to empty values without local generated points',
      () {
        final route = TripRouteDetail.fromJson({});

        expect(route.points, isEmpty);
        expect(route.segments, isEmpty);
        expect(route.totalDistanceKm, 0);
        expect(route.totalDurationSeconds, 0);
        expect(route.avgSpeedKmh, 0);
        expect(route.payout, 0);
      },
    );

    test('drops invalid route points instead of defaulting them to zero', () {
      final route = TripRouteDetail.fromJson({
        'tripId': 'order-1',
        'points': [
          {
            'lat': 10.7769,
            'lng': 106.7009,
            'timestamp': '2026-07-03T08:00:00.000Z',
          },
          {'timestamp': '2026-07-03T08:05:00.000Z'},
          {
            'lat': 13.7563,
            'lng': 100.5018,
            'timestamp': '2026-07-03T08:10:00.000Z',
          },
        ],
      });

      expect(route.points, hasLength(1));
      expect(route.points.single.lat, 10.7769);
      expect(route.points.single.lng, 106.7009);
    });

    test('RoutePoint rejects invalid coordinates explicitly', () {
      expect(
        () => RoutePoint.fromJson({
          'lat': 0,
          'lng': 0,
          'timestamp': '2026-07-03T08:00:00.000Z',
        }),
        throwsA(isA<FormatException>()),
      );
    });
  });
}
