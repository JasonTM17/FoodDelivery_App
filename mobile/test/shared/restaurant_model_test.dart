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

  group('RestaurantModel ratings', () {
    test(
      'does not fabricate aggregate restaurant ratings when API omits them',
      () {
        final restaurant = RestaurantModel.fromJson({
          'id': 'restaurant-1',
          'name': 'Real Bistro',
        });

        expect(restaurant.rating, isNull);
        expect(restaurant.toJson()['rating'], isNull);
      },
    );

    test('does not fabricate perfect review ratings when API omits them', () {
      final review = ReviewModel.fromJson({
        'id': 'review-1',
        'userId': 'user-1',
        'createdAt': '2026-07-06T00:00:00.000Z',
      });

      expect(review.foodRating, isNull);
      expect(review.deliveryRating, isNull);
      expect(review.toJson()['foodRating'], isNull);
      expect(review.toJson()['deliveryRating'], isNull);
    });

    test('keeps valid backend rating values', () {
      final restaurant = RestaurantModel.fromJson({
        'id': 'restaurant-1',
        'name': 'Real Bistro',
        'rating': '4.6',
      });
      final review = ReviewModel.fromJson({
        'id': 'review-1',
        'userId': 'user-1',
        'foodRating': 4,
        'deliveryRating': 5,
        'createdAt': '2026-07-06T00:00:00.000Z',
      });

      expect(restaurant.rating, 4.6);
      expect(review.foodRating, 4);
      expect(review.deliveryRating, 5);
    });
  });
}
