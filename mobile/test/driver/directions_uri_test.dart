import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/utils/directions_uri.dart';

void main() {
  group('buildGoogleMapsDirectionsUri', () {
    test('builds navigation URL with explicit driver origin', () {
      final uri = buildGoogleMapsDirectionsUri(
        originLat: 10.7769,
        originLng: 106.7009,
        destinationLat: 10.7821,
        destinationLng: 106.6956,
      );

      expect(uri, isNotNull);
      expect(uri!.host, 'www.google.com');
      expect(uri.path, '/maps/dir/');
      expect(uri.queryParameters['api'], '1');
      expect(uri.queryParameters['origin'], '10.776900,106.700900');
      expect(uri.queryParameters['destination'], '10.782100,106.695600');
      expect(uri.queryParameters['travelmode'], 'driving');
      expect(uri.queryParameters['dir_action'], 'navigate');
    });

    test('omits origin when driver coordinates are unavailable', () {
      final uri = buildGoogleMapsDirectionsUri(
        originLat: 0,
        originLng: 0,
        destinationLat: 10.7821,
        destinationLng: 106.6956,
      );

      expect(uri, isNotNull);
      expect(uri!.queryParameters.containsKey('origin'), isFalse);
      expect(uri.queryParameters['destination'], '10.782100,106.695600');
    });

    test(
      'returns null instead of fabricating directions for invalid destination',
      () {
        final uri = buildGoogleMapsDirectionsUri(
          originLat: 10.7769,
          originLng: 106.7009,
          destinationLat: null,
          destinationLng: 106.6956,
        );

        expect(uri, isNull);
      },
    );

    test('rejects navigation outside the Vietnam delivery map', () {
      final uri = buildGoogleMapsDirectionsUri(
        originLat: 10.7769,
        originLng: 106.7009,
        destinationLat: 13.7563,
        destinationLng: 100.5018,
      );

      expect(uri, isNull);
    });
  });
}
