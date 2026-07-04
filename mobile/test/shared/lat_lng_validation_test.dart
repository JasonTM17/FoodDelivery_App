import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/maps/lat_lng_validation.dart';

void main() {
  group('isValidDeliveryLatLng', () {
    test('accepts real Vietnam delivery coordinates', () {
      expect(isValidDeliveryLatLng(10.7769, 106.7009), isTrue);
      expect(isValidDeliveryLatLng(21.0278, 105.8342), isTrue);
    });

    test('rejects missing, non-finite, zero, and out-of-world coordinates', () {
      expect(isValidDeliveryLatLng(null, 106.7009), isFalse);
      expect(isValidDeliveryLatLng(double.nan, 106.7009), isFalse);
      expect(isValidDeliveryLatLng(0, 0), isFalse);
      expect(isValidDeliveryLatLng(91, 106.7009), isFalse);
      expect(isValidDeliveryLatLng(10.7769, 181), isFalse);
    });

    test('rejects coordinates outside Vietnam operating bounds', () {
      expect(isValidDeliveryLatLng(13.7563, 100.5018), isFalse);
      expect(isValidDeliveryLatLng(35.6762, 139.6503), isFalse);
    });
  });
}
