import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';
import 'package:foodflow_customer/shared/api/realtime_client.dart';
import 'package:foodflow_customer/shared/config/app_config.dart';
import 'package:foodflow_customer/shared/models/order.dart';

class _TestDriverNotifier extends DriverNotifier {
  _TestDriverNotifier({required RealtimeClient realtime})
    : super(realtime: realtime);

  void seed(DriverState value) {
    state = value;
  }
}

class _LogoutApiInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/driver/offline' || options.path == '/auth/logout') {
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: const {},
        ),
      );
      return;
    }
    handler.reject(
      DioException(
        requestOptions: options,
        message: 'Unexpected API request: ${options.path}',
      ),
    );
  }
}

class _LogoutWithActiveOrderApiInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/driver/orders/active' && options.method == 'GET') {
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: _activeOrderPayload,
        ),
      );
      return;
    }
    if (options.path == '/driver/offline' || options.path == '/auth/logout') {
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: const {},
        ),
      );
      return;
    }
    handler.reject(
      DioException(
        requestOptions: options,
        message: 'Unexpected API request: ${options.path}',
      ),
    );
  }
}

class _ActiveOrderApiInterceptor extends Interceptor {
  int activeOrderFetchCount = 0;
  int todayStatsFetchCount = 0;
  final todayStatsRequested = Completer<void>();
  final todayStatsResponse = Completer<void>();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/driver/orders/active' && options.method == 'GET') {
      activeOrderFetchCount += 1;
      if (activeOrderFetchCount > 1) {
        handler.reject(
          DioException(
            requestOptions: options,
            message: 'Terminal realtime status must not refetch active order',
          ),
        );
        return;
      }
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: _activeOrderPayload,
        ),
      );
      return;
    }
    if (options.path == '/driver/earnings' &&
        options.method == 'GET' &&
        options.queryParameters['period'] == 'today') {
      todayStatsFetchCount += 1;
      if (!todayStatsRequested.isCompleted) todayStatsRequested.complete();
      todayStatsResponse.future.then((_) {
        handler.resolve(
          Response<Map<String, dynamic>>(
            requestOptions: options,
            statusCode: 200,
            data: const {'totalEarnings': 120000, 'totalOrders': 4},
          ),
        );
      });
      return;
    }
    handler.reject(
      DioException(
        requestOptions: options,
        message: 'Unexpected API request: ${options.path}',
      ),
    );
  }
}

class _TerminalStatusRaceInterceptor extends Interceptor {
  int activeOrderFetchCount = 0;
  int todayStatsFetchCount = 0;
  final patchStarted = Completer<void>();
  final patchResponse = Completer<void>();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/driver/orders/active' && options.method == 'GET') {
      activeOrderFetchCount += 1;
      final orderId = activeOrderFetchCount == 1 ? 'order-active' : 'order-new';
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: {..._activeOrderPayload, 'id': orderId},
        ),
      );
      return;
    }
    if (options.path == '/driver/orders/order-active/status' &&
        options.method == 'PATCH') {
      if (!patchStarted.isCompleted) patchStarted.complete();
      patchResponse.future.then((_) {
        handler.resolve(
          Response<Map<String, dynamic>>(
            requestOptions: options,
            statusCode: 200,
            data: const {},
          ),
        );
      });
      return;
    }
    if (options.path == '/driver/earnings' &&
        options.method == 'GET' &&
        options.queryParameters['period'] == 'today') {
      todayStatsFetchCount += 1;
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: const {'totalEarnings': 120000, 'totalOrders': 4},
        ),
      );
      return;
    }
    handler.reject(
      DioException(
        requestOptions: options,
        message: 'Unexpected API request: ${options.path}',
      ),
    );
  }
}

class _StaleActiveOrderSnapshotInterceptor extends Interceptor {
  int activeOrderFetchCount = 0;
  final staleFetchStarted = Completer<void>();
  final staleFetchResponse = Completer<void>();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/driver/orders/active' && options.method == 'GET') {
      activeOrderFetchCount += 1;
      if (activeOrderFetchCount == 1) {
        handler.resolve(
          Response<Map<String, dynamic>>(
            requestOptions: options,
            statusCode: 200,
            data: _activeOrderPayload,
          ),
        );
        return;
      }
      if (activeOrderFetchCount == 2) {
        if (!staleFetchStarted.isCompleted) staleFetchStarted.complete();
        staleFetchResponse.future.then((_) {
          handler.resolve(
            Response<Map<String, dynamic>>(
              requestOptions: options,
              statusCode: 200,
              data: _activeOrderPayload,
            ),
          );
        });
        return;
      }
    }
    handler.reject(
      DioException(
        requestOptions: options,
        message: 'Unexpected API request: ${options.path}',
      ),
    );
  }
}

class _AvailabilityRaceInterceptor extends Interceptor {
  final onlineStarted = Completer<void>();
  final onlineResponse = Completer<void>();
  final calls = <String>[];
  Map<String, dynamic>? onlinePayload;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/driver/online') {
      calls.add('online');
      onlinePayload = Map<String, dynamic>.from(
        options.data as Map<String, dynamic>,
      );
      if (!onlineStarted.isCompleted) onlineStarted.complete();
      onlineResponse.future.then((_) {
        handler.resolve(
          Response<Map<String, dynamic>>(
            requestOptions: options,
            statusCode: 200,
            data: const {},
          ),
        );
      });
      return;
    }
    if (options.path == '/driver/offline') {
      calls.add('offline');
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: const {},
        ),
      );
      return;
    }
    handler.reject(
      DioException(
        requestOptions: options,
        message: 'Unexpected API request: ${options.path}',
      ),
    );
  }
}

class _ControllableRealtimeTransport implements RealtimeTransport {
  final _orderStatus = StreamController<Map<String, dynamic>>.broadcast();
  final _eta = StreamController<Map<String, dynamic>>.broadcast();
  final _offer = StreamController<Map<String, dynamic>>.broadcast();
  final _assignment = StreamController<Map<String, dynamic>>.broadcast();
  final _location = StreamController<Map<String, dynamic>>.broadcast();
  final _notification = StreamController<Map<String, dynamic>>.broadcast();
  final _authRefresh = StreamController<void>.broadcast();

  bool connected = false;
  int disconnectCount = 0;
  int unsubscribeOrderCount = 0;
  final subscribedOrderIds = <String>[];
  final unsubscribedOrderIds = <String>[];

  @override
  bool get isConnected => connected;

  @override
  Stream<Map<String, dynamic>> get onDriverLocation => _location.stream;

  @override
  Stream<Map<String, dynamic>> get onOrderStatus => _orderStatus.stream;

  @override
  Stream<Map<String, dynamic>> get onEtaUpdate => _eta.stream;

  @override
  Stream<Map<String, dynamic>> get onNotification => _notification.stream;

  @override
  Stream<Map<String, dynamic>> get onDriverOffer => _offer.stream;

  @override
  Stream<Map<String, dynamic>> get onDriverOrderAssigned => _assignment.stream;

  @override
  Stream<void> get onAuthRefreshRequired => _authRefresh.stream;

  @override
  Future<void> connect() async {
    connected = true;
  }

  @override
  Future<void> disconnect() async {
    disconnectCount += 1;
    connected = false;
  }

  @override
  Future<void> reconnectWithToken(String newToken) async {}

  @override
  Future<void> subscribeOrder(String orderId) async {
    subscribedOrderIds.add(orderId);
  }

  @override
  Future<void> unsubscribeOrder(String orderId) async {
    unsubscribeOrderCount += 1;
    unsubscribedOrderIds.add(orderId);
  }

  void addOffer(Map<String, dynamic> offer) {
    _offer.add(offer);
  }

  void addOrderStatus(Map<String, dynamic> status) {
    _orderStatus.add(status);
  }

  Future<void> close() async {
    await Future.wait([
      _orderStatus.close(),
      _eta.close(),
      _offer.close(),
      _assignment.close(),
      _location.close(),
      _notification.close(),
      _authRefresh.close(),
    ]);
  }

  @override
  void dispose() {}
}

class _QueuedOrderStatusTransport extends _ControllableRealtimeTransport {
  final _listeners = <MultiStreamController<Map<String, dynamic>>>[];
  final _queuedEvents =
      <
        ({
          List<MultiStreamController<Map<String, dynamic>>> listeners,
          Map<String, dynamic> data,
        })
      >[];
  late final Stream<Map<String, dynamic>> _queuedOrderStatus = Stream.multi((
    controller,
  ) {
    _listeners.add(controller);
    controller.onCancel = () {
      _listeners.remove(controller);
    };
  }, isBroadcast: true);

  @override
  Stream<Map<String, dynamic>> get onOrderStatus => _queuedOrderStatus;

  @override
  void addOrderStatus(Map<String, dynamic> status) {
    _queuedEvents.add((
      listeners: List<MultiStreamController<Map<String, dynamic>>>.of(
        _listeners,
      ),
      data: Map<String, dynamic>.of(status),
    ));
  }

  void flushOrderStatus() {
    final event = _queuedEvents.removeAt(0);
    for (final listener in event.listeners) {
      listener.add(event.data);
    }
  }
}

const _dispatchOffer = {
  'orderId': 'order-1',
  'offerToken': 'offer-token',
  'restaurantName': 'Pho 24',
  'restaurantAddress': '1 Hai Ba Trung',
  'deliveryAddress': '123 Le Loi',
  'orderTotal': 120000,
  'deliveryFee': 18000,
  'distanceKm': 2.4,
  'timeoutSeconds': 30,
  'surgeMultiplier': 1.0,
};

final _activeOrderPayload = <String, dynamic>{
  'id': 'order-active',
  'customerId': 'customer-1',
  'restaurantId': 'restaurant-1',
  'restaurant': {'name': 'Pho 24'},
  'deliveryAddress': {'addressLine': '2 Le Loi'},
  'orderItems': [
    {
      'menuItemId': 'menu-1',
      'nameSnapshot': 'Pho bo',
      'quantity': 1,
      'unitPrice': 95000,
    },
  ],
  'status': 'delivering',
  'subtotal': 95000,
  'deliveryFee': 20000,
  'discount': 0,
  'total': 115000,
  'paymentMethod': 'cash',
  'createdAt': '2026-07-05T10:00:00.000Z',
  'updatedAt': '2026-07-05T10:05:00.000Z',
};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  for (final terminalStatus in ['refunded', 'completed']) {
    test(
      '$terminalStatus realtime clears local tracking and subscriptions',
      () async {
        FlutterSecureStorage.setMockInitialValues({});
        final interceptor = _ActiveOrderApiInterceptor();
        ApiClient.instance.dio.interceptors.add(interceptor);
        final transport = _ControllableRealtimeTransport();
        final realtime = RealtimeClient.forTesting(
          provider: RealtimeProvider.supabase,
          transport: transport,
          postCommand: (_, _) async {},
        );
        final notifier = _TestDriverNotifier(realtime: realtime)
          ..seed(const DriverState(isAuthenticated: true, isOnline: true));

        try {
          await notifier.fetchActiveOrder();
          expect(notifier.state.activeOrder?.id, 'order-active');

          transport.addOrderStatus({
            'orderId': 'order-active',
            'status': terminalStatus,
          });

          if (terminalStatus == 'completed') {
            await interceptor.todayStatsRequested.future.timeout(
              const Duration(seconds: 1),
            );
            notifier.seed(
              notifier.state.copyWith(
                activeOrder: OrderModel.fromJson({
                  ..._activeOrderPayload,
                  'id': 'order-new',
                }),
              ),
            );
            interceptor.todayStatsResponse.complete();
          }
          await Future<void>.delayed(const Duration(milliseconds: 10));

          expect(
            notifier.state.activeOrder?.id,
            terminalStatus == 'completed' ? 'order-new' : null,
          );
          expect(interceptor.activeOrderFetchCount, 1);
          expect(transport.unsubscribeOrderCount, 1);
          expect(
            interceptor.todayStatsFetchCount,
            terminalStatus == 'completed' ? 1 : 0,
          );
        } finally {
          if (!interceptor.todayStatsResponse.isCompleted) {
            interceptor.todayStatsResponse.complete();
          }
          notifier.dispose();
          await Future<void>.delayed(Duration.zero);
          await transport.close();
          ApiClient.instance.dio.interceptors.remove(interceptor);
        }
      },
    );
  }

  test(
    'a delayed terminal PATCH cannot clear a newly assigned order',
    () async {
      FlutterSecureStorage.setMockInitialValues({});
      final interceptor = _TerminalStatusRaceInterceptor();
      ApiClient.instance.dio.interceptors.add(interceptor);
      final transport = _ControllableRealtimeTransport();
      final realtime = RealtimeClient.forTesting(
        provider: RealtimeProvider.supabase,
        transport: transport,
        postCommand: (_, _) async {},
      );
      final notifier = _TestDriverNotifier(realtime: realtime)
        ..seed(const DriverState(isAuthenticated: true, isOnline: true));

      try {
        await notifier.fetchActiveOrder();
        expect(notifier.state.activeOrder?.id, 'order-active');

        final update = notifier.updateOrderStatus('order-active', 'completed');
        await interceptor.patchStarted.future;

        transport.addOrderStatus({
          'orderId': 'order-active',
          'status': 'completed',
        });
        for (var attempt = 0; attempt < 20; attempt += 1) {
          if (transport.unsubscribeOrderCount == 1 &&
              interceptor.todayStatsFetchCount == 1) {
            break;
          }
          await Future<void>.delayed(Duration.zero);
        }
        expect(notifier.state.activeOrder, isNull);

        await notifier.fetchActiveOrder();
        expect(notifier.state.activeOrder?.id, 'order-new');

        interceptor.patchResponse.complete();
        await update;

        expect(notifier.state.activeOrder?.id, 'order-new');
        expect(transport.subscribedOrderIds, ['order-active', 'order-new']);
        expect(transport.unsubscribedOrderIds, ['order-active']);
        expect(interceptor.todayStatsFetchCount, 1);
      } finally {
        if (!interceptor.patchResponse.isCompleted) {
          interceptor.patchResponse.complete();
        }
        notifier.dispose();
        await Future<void>.delayed(Duration.zero);
        await transport.close();
        ApiClient.instance.dio.interceptors.remove(interceptor);
      }
    },
  );

  test(
    'a stale active-order snapshot cannot resurrect a terminal order',
    () async {
      FlutterSecureStorage.setMockInitialValues({});
      final interceptor = _StaleActiveOrderSnapshotInterceptor();
      ApiClient.instance.dio.interceptors.add(interceptor);
      final transport = _ControllableRealtimeTransport();
      final realtime = RealtimeClient.forTesting(
        provider: RealtimeProvider.supabase,
        transport: transport,
        postCommand: (_, _) async {},
      );
      final notifier = _TestDriverNotifier(realtime: realtime)
        ..seed(const DriverState(isAuthenticated: true, isOnline: true));

      try {
        await notifier.fetchActiveOrder();
        expect(notifier.state.activeOrder?.id, 'order-active');

        final staleFetch = notifier.fetchActiveOrder();
        await interceptor.staleFetchStarted.future;

        transport.addOrderStatus({
          'orderId': 'order-active',
          'status': 'refunded',
        });
        for (var attempt = 0; attempt < 20; attempt += 1) {
          if (transport.unsubscribeOrderCount == 1 &&
              notifier.state.activeOrder == null) {
            break;
          }
          await Future<void>.delayed(Duration.zero);
        }
        expect(notifier.state.activeOrder, isNull);

        interceptor.staleFetchResponse.complete();
        await staleFetch;

        expect(notifier.state.activeOrder, isNull);
        expect(transport.subscribedOrderIds, ['order-active']);
        expect(transport.unsubscribedOrderIds, ['order-active']);
      } finally {
        if (!interceptor.staleFetchResponse.isCompleted) {
          interceptor.staleFetchResponse.complete();
        }
        notifier.dispose();
        await Future<void>.delayed(Duration.zero);
        await transport.close();
        ApiClient.instance.dio.interceptors.remove(interceptor);
      }
    },
  );

  test(
    'a queued terminal event wins when a stale fetch installs a new listener first',
    () async {
      FlutterSecureStorage.setMockInitialValues({});
      final interceptor = _StaleActiveOrderSnapshotInterceptor();
      ApiClient.instance.dio.interceptors.add(interceptor);
      final transport = _QueuedOrderStatusTransport();
      final realtime = RealtimeClient.forTesting(
        provider: RealtimeProvider.supabase,
        transport: transport,
        postCommand: (_, _) async {},
      );
      final notifier = _TestDriverNotifier(realtime: realtime)
        ..seed(const DriverState(isAuthenticated: true, isOnline: true));

      try {
        await notifier.fetchActiveOrder();
        expect(notifier.state.activeOrder?.id, 'order-active');

        final staleFetch = notifier.fetchActiveOrder();
        await interceptor.staleFetchStarted.future;

        // The realtime controller queues delivery asynchronously. Completing
        // the stale response now lets its continuation rotate the listener
        // before the already-queued terminal event is dispatched.
        transport.addOrderStatus({
          'orderId': 'order-active',
          'status': 'refunded',
        });
        scheduleMicrotask(interceptor.staleFetchResponse.complete);
        await staleFetch;
        transport.flushOrderStatus();
        for (var attempt = 0; attempt < 20; attempt += 1) {
          if (transport.unsubscribeOrderCount == 1 &&
              notifier.state.activeOrder == null) {
            break;
          }
          await Future<void>.delayed(Duration.zero);
        }

        expect(notifier.state.activeOrder, isNull);
        expect(transport.subscribedOrderIds, ['order-active', 'order-active']);
        expect(transport.unsubscribedOrderIds, ['order-active']);
      } finally {
        if (!interceptor.staleFetchResponse.isCompleted) {
          interceptor.staleFetchResponse.complete();
        }
        notifier.dispose();
        await Future<void>.delayed(Duration.zero);
        await transport.close();
        ApiClient.instance.dio.interceptors.remove(interceptor);
      }
    },
  );

  test('persistent terminal listener is inert after logout', () async {
    FlutterSecureStorage.setMockInitialValues({});
    final interceptor = _LogoutWithActiveOrderApiInterceptor();
    ApiClient.instance.dio.interceptors.add(interceptor);
    final transport = _QueuedOrderStatusTransport();
    final realtime = RealtimeClient.forTesting(
      provider: RealtimeProvider.supabase,
      transport: transport,
      postCommand: (_, _) async {},
    );
    final notifier = _TestDriverNotifier(realtime: realtime)
      ..seed(const DriverState(isAuthenticated: true, isOnline: true));

    try {
      await notifier.fetchActiveOrder();
      expect(notifier.state.activeOrder?.id, 'order-active');

      transport.addOrderStatus({
        'orderId': 'order-active',
        'status': 'refunded',
      });
      await notifier.logout();
      transport.flushOrderStatus();
      await Future<void>.delayed(Duration.zero);

      expect(notifier.state.isAuthenticated, isFalse);
      expect(notifier.state.activeOrder, isNull);
      expect(transport.unsubscribeOrderCount, 1);
    } finally {
      notifier.dispose();
      await Future<void>.delayed(Duration.zero);
      await transport.close();
      ApiClient.instance.dio.interceptors.remove(interceptor);
    }
  });

  for (final provider in RealtimeProvider.values) {
    test(
      '${provider.name} realtime callbacks cannot repopulate a logged-out driver session',
      () async {
        FlutterSecureStorage.setMockInitialValues({});
        final interceptor = _LogoutApiInterceptor();
        ApiClient.instance.dio.interceptors.add(interceptor);
        final transport = _ControllableRealtimeTransport();
        final realtime = RealtimeClient.forTesting(
          provider: provider,
          transport: transport,
          postCommand: (_, _) async {},
        );
        final notifier = _TestDriverNotifier(realtime: realtime)
          ..seed(const DriverState(isAuthenticated: true, isOnline: true));

        try {
          await notifier.startDispatchOfferListener();
          transport.addOffer(_dispatchOffer);
          await Future<void>.delayed(Duration.zero);
          expect(notifier.state.pendingOffer, isNotNull);

          await notifier.logout();

          expect(transport.disconnectCount, 1);
          expect(notifier.state.isAuthenticated, isFalse);
          expect(notifier.state.pendingOffer, isNull);

          transport.addOffer(_dispatchOffer);
          await Future<void>.delayed(Duration.zero);

          expect(notifier.state.isAuthenticated, isFalse);
          expect(notifier.state.pendingOffer, isNull);
        } finally {
          notifier.dispose();
          await Future<void>.delayed(Duration.zero);
          await transport.close();
          ApiClient.instance.dio.interceptors.remove(interceptor);
        }
      },
    );
  }

  test(
    'an in-flight dispatch rejection cannot restore offers after logout',
    () async {
      FlutterSecureStorage.setMockInitialValues({});
      final interceptor = _LogoutApiInterceptor();
      ApiClient.instance.dio.interceptors.add(interceptor);
      final transport = _ControllableRealtimeTransport();
      final response = Completer<void>();
      final realtime = RealtimeClient.forTesting(
        provider: RealtimeProvider.supabase,
        transport: transport,
        postCommand: (_, _) => response.future,
      );
      final notifier = _TestDriverNotifier(realtime: realtime)
        ..seed(
          DriverState(
            isAuthenticated: true,
            isOnline: true,
            pendingOffer: DispatchOffer.fromJson(_dispatchOffer),
          ),
        );

      try {
        final decline = notifier.declineOrder(
          DispatchOffer.fromJson(_dispatchOffer),
        );
        await Future<void>.delayed(Duration.zero);

        await notifier.logout();
        response.completeError(
          DioException(
            requestOptions: RequestOptions(
              path: '/driver/dispatch/offers/order-1/respond',
            ),
            message: 'request aborted after logout',
          ),
        );
        await decline;

        expect(notifier.state.isAuthenticated, isFalse);
        expect(notifier.state.pendingOffer, isNull);
        expect(notifier.state.error, isNull);
      } finally {
        notifier.dispose();
        await Future<void>.delayed(Duration.zero);
        await transport.close();
        ApiClient.instance.dio.interceptors.remove(interceptor);
      }
    },
  );

  test(
    'offline waits for an in-flight online request and wins the race',
    () async {
      FlutterSecureStorage.setMockInitialValues({});
      final interceptor = _AvailabilityRaceInterceptor();
      ApiClient.instance.dio.interceptors.add(interceptor);
      final transport = _ControllableRealtimeTransport();
      final realtime = RealtimeClient.forTesting(
        provider: RealtimeProvider.supabase,
        transport: transport,
        postCommand: (_, _) async {},
      );
      final notifier = _TestDriverNotifier(realtime: realtime)
        ..seed(const DriverState(isAuthenticated: true));

      try {
        final online = notifier.goOnline(
          10.7769,
          106.7009,
          sampledAt: DateTime.now(),
          accuracy: 5,
        );
        await interceptor.onlineStarted.future;
        expect(interceptor.onlinePayload?['accuracy'], 5);

        final offline = notifier.goOffline();
        await Future<void>.delayed(Duration.zero);
        expect(interceptor.calls, ['online']);

        interceptor.onlineResponse.complete();
        await Future.wait([online, offline]);

        expect(interceptor.calls, ['online', 'offline']);
        expect(notifier.state.isOnline, isFalse);
        expect(transport.connected, isFalse);
      } finally {
        notifier.dispose();
        await Future<void>.delayed(Duration.zero);
        await transport.close();
        ApiClient.instance.dio.interceptors.remove(interceptor);
      }
    },
  );

  test(
    'a missing fresh GPS sample cannot preserve a stale online state',
    () async {
      FlutterSecureStorage.setMockInitialValues({});
      final interceptor = _AvailabilityRaceInterceptor();
      ApiClient.instance.dio.interceptors.add(interceptor);
      final transport = _ControllableRealtimeTransport();
      final realtime = RealtimeClient.forTesting(
        provider: RealtimeProvider.supabase,
        transport: transport,
        postCommand: (_, _) async {},
      );
      final notifier = _TestDriverNotifier(realtime: realtime)
        ..seed(const DriverState(isAuthenticated: true, isOnline: true));

      try {
        await notifier.goOnline(10.7769, 106.7009, sampledAt: null);

        expect(notifier.state.isOnline, isFalse);
        expect(interceptor.calls, ['offline']);
      } finally {
        notifier.dispose();
        await Future<void>.delayed(Duration.zero);
        await transport.close();
        ApiClient.instance.dio.interceptors.remove(interceptor);
      }
    },
  );
}
