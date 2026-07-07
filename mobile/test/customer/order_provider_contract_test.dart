import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/address_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';
import 'package:foodflow_customer/shared/models/order.dart';
import 'package:foodflow_customer/shared/models/user.dart';
import 'package:foodflow_customer/shared/providers/order_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _OrderApiInterceptor apiInterceptor;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    apiInterceptor = _OrderApiInterceptor();
    ApiClient.instance.dio.interceptors.add(apiInterceptor);
  });

  tearDown(() {
    ApiClient.instance.dio.interceptors.remove(apiInterceptor);
  });

  test('placeOrder sends the backend cart checkout contract only', () async {
    final notifier = OrderNotifier();

    final orderId = await notifier.placeOrder(
      addressId: 'addr-1',
      paymentMethod: 'cash',
      notes: '  Leave at reception  ',
      promotionCode: '  SAVE10  ',
    );

    expect(orderId, 'order-active');
    expect(apiInterceptor.placeOrderIdempotencyKey, isNotEmpty);
    expect(apiInterceptor.placeOrderPayload, {
      'addressId': 'addr-1',
      'paymentMethod': 'cash',
      'notes': 'Leave at reception',
      'promotionCode': 'SAVE10',
    });
    expect(apiInterceptor.placeOrderPayload, isNot(contains('restaurantId')));
    expect(apiInterceptor.placeOrderPayload, isNot(contains('items')));
    expect(
      apiInterceptor.placeOrderPayload,
      isNot(contains('deliveryAddress')),
    );
    expect(
      notifier.state.currentTrackingOrder?.deliveryAddress.address,
      '2 Le Loi',
    );
    expect(
      notifier.state.currentTrackingOrder?.deliveryAddress.latitude.isNaN,
      isTrue,
    );
  });

  test(
    'fetchOrders accepts backend order envelope and orderItems snapshots',
    () async {
      final notifier = OrderNotifier();

      await notifier.fetchOrders();

      expect(notifier.state.activeOrders, hasLength(1));
      expect(notifier.state.completedOrders, hasLength(1));
      expect(notifier.state.cancelledOrders, hasLength(1));
      expect(notifier.state.activeOrders.single.restaurantName, 'Pho 24');
      expect(notifier.state.activeOrders.single.items.single.name, 'Pho bo');
    },
  );

  test(
    'fetchOrders rejects malformed envelopes instead of faking empty orders',
    () async {
      final notifier = OrderNotifier();

      await notifier.fetchOrders();
      expect(notifier.state.activeOrders, hasLength(1));

      apiInterceptor.ordersResponseOverride = {
        'meta': {'total': 0},
      };

      await notifier.fetchOrders();

      expect(notifier.state.error, isNotNull);
      expect(notifier.state.activeOrders, hasLength(1));
    },
  );

  test('submitReview posts to singular backend review endpoint', () async {
    final notifier = OrderNotifier();

    final submitted = await notifier.submitReview(
      'order-active',
      5,
      4,
      '  Great driver  ',
    );

    expect(submitted, isTrue);
    expect(apiInterceptor.reviewPath, '/orders/order-active/review');
    expect(apiInterceptor.reviewPayload, {
      'foodRating': 5,
      'deliveryRating': 4,
      'comment': 'Great driver',
    });
    expect(apiInterceptor.ordersFetchCount, 1);
  });

  test('AddressModel reads addressLine without inventing zero coordinates', () {
    final address = AddressModel.fromJson({
      'id': 'addr-1',
      'label': 'Home',
      'addressLine': '2 Le Loi',
      'isDefault': true,
    });

    expect(address.address, '2 Le Loi');
    expect(address.latitude, isNull);
    expect(address.longitude, isNull);
    expect(address.toJson(), isNot(contains('latitude')));
    expect(address.toJson(), isNot(contains('longitude')));
    expect(address.toJson()['addressLine'], '2 Le Loi');
  });

  test('addAddress refuses missing map coordinates before API POST', () async {
    final notifier = AddressNotifier();

    final saved = await notifier.addAddress(label: 'Home', address: '2 Le Loi');

    expect(saved, isFalse);
    expect(notifier.state.error, 'ADDRESS_LOCATION_REQUIRED');
    expect(apiInterceptor.addressPostCount, 0);
  });

  test('updateOrderStatus uses backend timestamp instead of local now', () {
    final notifier = OrderNotifier();
    final original = OrderModel.fromJson(
      _orderPayload(id: 'order-active', status: 'preparing'),
    );
    notifier.setTrackingOrder(original);

    notifier.updateOrderStatus('order-active', 'delivering');

    expect(notifier.state.currentTrackingOrder?.status, 'delivering');
    expect(notifier.state.currentTrackingOrder?.updatedAt, original.updatedAt);

    final backendTimestamp = DateTime.parse('2026-07-05T10:15:00.000Z');
    notifier.updateOrderStatus(
      'order-active',
      'delivered',
      updatedAt: backendTimestamp,
    );

    expect(notifier.state.currentTrackingOrder?.status, 'delivered');
    expect(notifier.state.currentTrackingOrder?.updatedAt, backendTimestamp);
  });

  test(
    'OrderModel rejects missing required backend money and state fields',
    () {
      final missingDeliveryFee = Map<String, dynamic>.from(
        _orderPayload(id: 'order-active', status: 'preparing'),
      )..remove('deliveryFee');
      final missingStatus = Map<String, dynamic>.from(
        _orderPayload(id: 'order-active', status: 'preparing'),
      )..remove('status');
      final missingPaymentMethod = Map<String, dynamic>.from(
        _orderPayload(id: 'order-active', status: 'preparing'),
      )..remove('paymentMethod');
      final missingTimelineStatus =
          Map<String, dynamic>.from(
              _orderPayload(id: 'order-active', status: 'preparing'),
            )
            ..['statusHistory'] = [
              {'timestamp': '2026-07-05T10:01:00.000Z'},
            ];
      final missingItemPrice =
          Map<String, dynamic>.from(
              _orderPayload(id: 'order-active', status: 'preparing'),
            )
            ..['orderItems'] = [
              {'menuItemId': 'menu-1', 'nameSnapshot': 'Pho bo', 'quantity': 1},
            ];

      expect(
        () => OrderModel.fromJson(missingDeliveryFee),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => OrderModel.fromJson(missingStatus),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => OrderModel.fromJson(missingPaymentMethod),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => OrderModel.fromJson(missingTimelineStatus),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => OrderModel.fromJson(missingItemPrice),
        throwsA(isA<FormatException>()),
      );
    },
  );

  test(
    'OrderItem computes line total from backend unit price and quantity',
    () {
      final order = OrderModel.fromJson(
        _orderPayload(id: 'order-active', status: 'preparing')
          ..['orderItems'] = [
            {
              'menuItemId': 'menu-1',
              'nameSnapshot': 'Pho bo',
              'quantity': 2,
              'unitPrice': 95000,
            },
          ],
      );

      expect(order.items.single.unitPrice, 95000);
      expect(order.items.single.totalPrice, 190000);
    },
  );
}

class _OrderApiInterceptor extends Interceptor {
  Map<String, dynamic>? placeOrderPayload;
  String? placeOrderIdempotencyKey;
  Map<String, dynamic>? reviewPayload;
  String? reviewPath;
  Map<String, dynamic>? ordersResponseOverride;
  int ordersFetchCount = 0;
  int addressPostCount = 0;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/orders' && options.method == 'POST') {
      placeOrderPayload = Map<String, dynamic>.from(
        options.data as Map<dynamic, dynamic>,
      );
      placeOrderIdempotencyKey =
          options.headers['X-Idempotency-Key'] as String?;
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 201,
          data: _orderPayload(id: 'order-active', status: 'pending'),
        ),
      );
      return;
    }

    if (options.path == '/orders' && options.method == 'GET') {
      ordersFetchCount += 1;
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data:
              ordersResponseOverride ??
              {
                'orders': [
                  _orderPayload(id: 'order-active', status: 'preparing'),
                  _orderPayload(id: 'order-complete', status: 'delivered'),
                  _orderPayload(id: 'order-cancelled', status: 'cancelled'),
                ],
                'meta': {'total': 3},
              },
        ),
      );
      return;
    }

    if (options.path == '/orders/order-active/review' &&
        options.method == 'POST') {
      reviewPath = options.path;
      reviewPayload = Map<String, dynamic>.from(
        options.data as Map<dynamic, dynamic>,
      );
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 201,
          data: {'ok': true},
        ),
      );
      return;
    }

    if (options.path == '/users/addresses' && options.method == 'POST') {
      addressPostCount += 1;
    }

    handler.next(options);
  }
}

Map<String, dynamic> _orderPayload({
  required String id,
  required String status,
}) => {
  'id': id,
  'customerId': 'customer-1',
  'restaurantId': 'restaurant-1',
  'restaurant': {
    'name': 'Pho 24',
    'logoUrl': 'https://cdn.foodflow.test/pho-24.png',
  },
  'deliveryAddress': {'addressLine': '2 Le Loi'},
  'orderItems': [
    {
      'menuItemId': 'menu-1',
      'nameSnapshot': 'Pho bo',
      'quantity': 1,
      'unitPrice': 95000,
      'totalPrice': 95000,
    },
  ],
  'status': status,
  'subtotal': 95000,
  'deliveryFee': 20000,
  'discount': 0,
  'total': 115000,
  'paymentMethod': 'cash',
  'createdAt': '2026-07-05T10:00:00.000Z',
  'updatedAt': '2026-07-05T10:05:00.000Z',
};
