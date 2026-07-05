import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/models/restaurant.dart';

void main() {
  group('RestaurantModel coordinates', () {
    test(
      'does not fabricate Null Island coordinates when API omits location',
      () {
        final restaurant = RestaurantModel.fromJson({
          'id': 'restaurant-1',
          'name': 'Real Bistro',
        });

        expect(restaurant.latitude.isNaN, isTrue);
        expect(restaurant.longitude.isNaN, isTrue);
        expect(restaurant.toJson()['latitude'], isNull);
        expect(restaurant.toJson()['longitude'], isNull);
      },
    );

    test(
      'keeps real backend coordinates from canonical and compact fields',
      () {
        final canonical = RestaurantModel.fromJson({
          'id': 'restaurant-1',
          'name': 'Real Bistro',
          'latitude': 10.7769,
          'longitude': 106.7009,
        });
        final compact = RestaurantModel.fromJson({
          'id': 'restaurant-2',
          'name': 'Compact Bistro',
          'lat': '10.7821',
          'lng': '106.6956',
        });

        expect(canonical.latitude, 10.7769);
        expect(canonical.longitude, 106.7009);
        expect(compact.latitude, 10.7821);
        expect(compact.longitude, 106.6956);
      },
    );
  });
}
