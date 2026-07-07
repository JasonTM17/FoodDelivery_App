import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/screens/restaurant_list_screen.dart';
import 'package:foodflow_customer/shared/models/restaurant.dart';

void main() {
  group('restaurantListInitialCameraPosition', () {
    test('uses the real current location when available', () {
      final camera = restaurantListInitialCameraPosition(
        currentLat: 21.0278,
        currentLng: 105.8342,
        restaurants: [_restaurant],
      );

      expect(camera, isNotNull);
      expect(camera!.target.latitude, 21.0278);
      expect(camera.target.longitude, 105.8342);
      expect(camera.zoom, 13);
    });

    test('uses backend restaurant coordinates when GPS is unavailable', () {
      final camera = restaurantListInitialCameraPosition(
        currentLat: null,
        currentLng: null,
        restaurants: [_restaurant],
      );

      expect(camera, isNotNull);
      expect(camera!.target.latitude, 10.8);
      expect(camera.target.longitude, 106.65);
      expect(camera.zoom, 12.5);
    });

    test('does not invent a Ho Chi Minh City fallback camera', () {
      final camera = restaurantListInitialCameraPosition(
        currentLat: null,
        currentLng: null,
        restaurants: const [],
      );

      expect(camera, isNull);
    });
  });
}

final _restaurant = RestaurantModel(
  id: 'restaurant-1',
  name: 'Real Kitchen',
  latitude: 10.8,
  longitude: 106.65,
);
