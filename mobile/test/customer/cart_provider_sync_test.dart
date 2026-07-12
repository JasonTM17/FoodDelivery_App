import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';
import 'package:foodflow_customer/shared/models/menu_item.dart';
import 'package:foodflow_customer/shared/providers/cart_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _CartApiInterceptor interceptor;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({'auth_token': 'test-token'});
    interceptor = _CartApiInterceptor();
    ApiClient.instance.dio.interceptors.add(interceptor);
  });

  tearDown(() {
    ApiClient.instance.dio.interceptors.remove(interceptor);
  });

  MenuItemModel item() => MenuItemModel(
    id: 'menu-1',
    restaurantId: 'rest-1',
    name: 'Phở',
    price: 50000,
    category: 'Món chính',
  );

  test('addItem posts to /cart/items', () async {
    final notifier = CartNotifier();
    await notifier.addItem(item: item(), quantity: 2);

    expect(interceptor.addCalls, 1);
    expect(interceptor.lastAddBody, {
      'restaurantId': 'rest-1',
      'menuItemId': 'menu-1',
      'quantity': 2,
    });
    expect(notifier.state.currentCart?.items.single.cartItemId, 'cart-item-1');
    expect(notifier.state.totalItemCount, 2);
  });

  test('updateItemQuantity patches /cart/items/:id', () async {
    final notifier = CartNotifier();
    await notifier.addItem(item: item(), quantity: 1);
    await notifier.updateItemQuantity(0, 3);

    expect(interceptor.patchPath, '/cart/items/cart-item-1');
    expect(interceptor.lastPatchBody, {'quantity': 3});
    expect(notifier.state.currentCart?.items.single.quantity, 3);
  });

  test('removeItem deletes /cart/items/:id', () async {
    final notifier = CartNotifier();
    await notifier.addItem(item: item(), quantity: 1);
    await notifier.removeItem(0);

    expect(interceptor.deletePath, '/cart/items/cart-item-1');
    expect(notifier.state.isEmpty, isTrue);
  });

  test('clearCart deletes /cart', () async {
    final notifier = CartNotifier();
    await notifier.addItem(item: item(), quantity: 1);
    await notifier.clearCart();

    expect(interceptor.clearCalled, isTrue);
    expect(notifier.state.isEmpty, isTrue);
  });
}

class _CartApiInterceptor extends Interceptor {
  int addCalls = 0;
  Map<String, dynamic>? lastAddBody;
  String? patchPath;
  Map<String, dynamic>? lastPatchBody;
  String? deletePath;
  bool clearCalled = false;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.method == 'POST' && options.path == '/cart/items') {
      addCalls++;
      lastAddBody = Map<String, dynamic>.from(options.data as Map);
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: {
            'id': 'cart-item-1',
            'menuItemId': lastAddBody!['menuItemId'],
            'quantity': lastAddBody!['quantity'],
            'unitPrice': 50000,
          },
        ),
      );
      return;
    }

    if (options.method == 'PATCH' &&
        options.path.startsWith('/cart/items/')) {
      patchPath = options.path;
      lastPatchBody = Map<String, dynamic>.from(options.data as Map);
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: {'id': 'cart-item-1', 'quantity': lastPatchBody!['quantity']},
        ),
      );
      return;
    }

    if (options.method == 'DELETE' && options.path == '/cart/items/cart-item-1') {
      deletePath = options.path;
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: {'deleted': true},
        ),
      );
      return;
    }

    if (options.method == 'DELETE' && options.path == '/cart') {
      clearCalled = true;
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: {'cleared': true},
        ),
      );
      return;
    }

    handler.next(options);
  }
}
