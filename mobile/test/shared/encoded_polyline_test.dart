import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/maps/encoded_polyline.dart';

void main() {
  group('encoded polyline decoder', () {
    test('decodes Google and OSRM polyline geometry', () {
      final points = decodeEncodedPolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');

      expect(points, hasLength(3));
      expect(points[0].latitude, closeTo(38.5, 0.00001));
      expect(points[0].longitude, closeTo(-120.2, 0.00001));
      expect(points[1].latitude, closeTo(40.7, 0.00001));
      expect(points[1].longitude, closeTo(-120.95, 0.00001));
      expect(points[2].latitude, closeTo(43.252, 0.00001));
      expect(points[2].longitude, closeTo(-126.453, 0.00001));
    });

    test(
      'does not generate route points for missing or malformed geometry',
      () {
        expect(tryDecodeEncodedPolyline(null), isEmpty);
        expect(tryDecodeEncodedPolyline(''), isEmpty);
        expect(tryDecodeEncodedPolyline('_p~iF'), isEmpty);
      },
    );
  });
}
