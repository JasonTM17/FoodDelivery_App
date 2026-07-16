import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';
import 'package:foodflow_customer/shared/api/realtime_client.dart';
import 'package:foodflow_customer/shared/config/app_config.dart';

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
  Future<void> subscribeOrder(String orderId) async {}

  @override
  Future<void> unsubscribeOrder(String orderId) async {}

  void addOffer(Map<String, dynamic> offer) {
    _offer.add(offer);
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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

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

  test('a missing fresh GPS sample cannot preserve a stale online state', () async {
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
  });
}
