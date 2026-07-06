import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';
import 'package:foodflow_customer/shared/providers/restaurant_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _RestaurantMenuApiInterceptor apiInterceptor;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    apiInterceptor = _RestaurantMenuApiInterceptor();
    ApiClient.instance.dio.interceptors.add(apiInterceptor);
  });

  tearDown(() {
    ApiClient.instance.dio.interceptors.remove(apiInterceptor);
  });

  test('fetchMenu parses the OpenAPI categories/items response', () async {
    final notifier = RestaurantNotifier();

    await notifier.fetchMenu('restaurant-1');

    expect(notifier.state.error, isNull);
    expect(notifier.state.isLoadingMenu, isFalse);
    expect(notifier.state.menuItems, hasLength(1));
    expect(notifier.state.menuItems.single.id, 'item-1');
    expect(notifier.state.menuItems.single.restaurantId, 'restaurant-1');
    expect(notifier.state.menuItems.single.category, 'Phở');
  });

  test(
    'fetchMenu rejects the old list response instead of rendering fake food',
    () async {
      apiInterceptor.payload = [];
      final notifier = RestaurantNotifier();

      await notifier.fetchMenu('restaurant-1');

      expect(notifier.state.isLoadingMenu, isFalse);
      expect(notifier.state.error, 'MENU_CONTRACT_INVALID_RESPONSE');
      expect(notifier.state.menuItems, isEmpty);
    },
  );

  test('fetchMenu rejects categories without item arrays', () async {
    apiInterceptor.payload = {
      'categories': [
        {'id': 'category-1', 'name': 'Phở'},
      ],
    };
    final notifier = RestaurantNotifier();

    await notifier.fetchMenu('restaurant-1');

    expect(notifier.state.error, 'MENU_CONTRACT_INVALID_RESPONSE');
    expect(notifier.state.menuItems, isEmpty);
  });
}

class _RestaurantMenuApiInterceptor extends Interceptor {
  dynamic payload = _restaurantMenuPayload();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/restaurants/restaurant-1/menu' &&
        options.method == 'GET') {
      handler.resolve(
        Response<dynamic>(
          requestOptions: options,
          statusCode: 200,
          data: payload,
        ),
      );
      return;
    }

    handler.next(options);
  }
}

Map<String, dynamic> _restaurantMenuPayload() => {
  'categories': [
    {
      'id': 'category-1',
      'name': 'Phở',
      'sortOrder': 1,
      'items': [
        {
          'id': 'item-1',
          'name': 'Phở bò',
          'description': '',
          'imageUrl': '',
          'basePrice': 65000,
          'isAvailable': true,
          'isPopular': true,
          'options': [
            {
              'id': 'option-1',
              'name': 'Size',
              'isRequired': true,
              'isMultiple': false,
              'values': [
                {'id': 'value-1', 'value': 'Lớn', 'priceModifier': 15000},
              ],
            },
          ],
        },
      ],
    },
  ],
};
