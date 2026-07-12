import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';
import 'package:foodflow_customer/shared/providers/restaurant_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _NearbyRestaurantsApiInterceptor apiInterceptor;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    apiInterceptor = _NearbyRestaurantsApiInterceptor();
    ApiClient.instance.dio.interceptors.add(apiInterceptor);
  });

  tearDown(() {
    ApiClient.instance.dio.interceptors.remove(apiInterceptor);
  });

  test(
    'fetchNearbyRestaurants sends OpenAPI lat/lng and cuisine parameters',
    () async {
      final notifier = RestaurantNotifier();

      await notifier.fetchNearbyRestaurants(
        latitude: 10.7769,
        longitude: 106.7009,
        cuisine: 'Vietnamese',
      );

      expect(notifier.state.error, isNull);
      expect(notifier.state.nearbyRestaurants, hasLength(1));
      expect(notifier.state.nearbyRestaurants.single.id, 'restaurant-1');
      expect(apiInterceptor.lastQueryParameters, {
        'lat': 10.7769,
        'lng': 106.7009,
        'cuisine': 'Vietnamese',
      });
    },
  );

  test(
    'fetchNearbyRestaurants requires real coordinates before API call',
    () async {
      final notifier = RestaurantNotifier();

      await notifier.fetchNearbyRestaurants();

      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.error, 'RESTAURANTS_LOCATION_REQUIRED');
      expect(notifier.state.nearbyRestaurants, isEmpty);
      expect(apiInterceptor.requestCount, 0);
    },
  );
}

class _NearbyRestaurantsApiInterceptor extends Interceptor {
  int requestCount = 0;
  Map<String, dynamic>? lastQueryParameters;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/restaurants/nearby' && options.method == 'GET') {
      requestCount += 1;
      lastQueryParameters = Map<String, dynamic>.from(options.queryParameters);
      handler.resolve(
        Response<dynamic>(
          requestOptions: options,
          statusCode: 200,
          data: [_restaurantPayload()],
        ),
      );
      return;
    }

    handler.next(options);
  }
}

Map<String, dynamic> _restaurantPayload() => {
  'id': 'restaurant-1',
  'name': 'Pho Real',
  'logoUrl': '',
  'rating': 4.8,
  'totalReviews': 10,
  'priceRange': 'low',
  'cuisineTypes': ['Vietnamese'],
  'isOpen': true,
  'lat': 10.7769,
  'lng': 106.7009,
};
