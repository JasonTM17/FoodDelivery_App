import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/widgets/address_location_picker.dart';

void main() {
  group('AddressLocationSelection', () {
    test('accepts a selected map point inside the delivery area', () {
      final selection = AddressLocationSelection.fromMapPoint(
        10.7769,
        106.7009,
      );

      expect(selection, isNotNull);
      expect(selection!.latitude, 10.7769);
      expect(selection.longitude, 106.7009);
    });

    test('rejects a selected map point outside the delivery area', () {
      expect(AddressLocationSelection.fromMapPoint(40, -73), isNull);
    });
  });
}
