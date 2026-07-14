import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_notifications_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';
import 'package:foodflow_customer/shared/api/realtime_client.dart';
import 'package:foodflow_customer/shared/config/app_config.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('DriverNotification parses canonical notification rows', () {
    final createdAt = DateTime.parse('2026-07-03T12:00:00Z');
    final notification = DriverNotification.fromJson({
      'id': 'notification-1',
      'type': 'order_update',
      'title': 'Order ready',
      'body': 'Pick up now',
      'createdAt': createdAt.toIso8601String(),
      'isRead': false,
      'data': {'eventType': 'order_update', 'deepLink': '/orders/order-1'},
    });

    expect(notification.id, 'notification-1');
    expect(notification.type, 'order_update');
    expect(notification.deepLink, '/orders/order-1');
    expect(notification.createdAt, createdAt);
    expect(notification.isRead, isFalse);
  });

  test('DriverNotification rejects rows missing required contract fields', () {
    final payload = _notificationPayload()..remove('isRead');

    expect(
      () => DriverNotification.fromJson(payload),
      throwsA(isA<FormatException>()),
    );
  });

  test(
    'DriverNotification copyWith marks notification read without losing fields',
    () {
      final notification = DriverNotification.fromJson(_notificationPayload());

      final updated = notification.copyWith(isRead: true);

      expect(updated.id, notification.id);
      expect(updated.type, notification.type);
      expect(updated.isRead, isTrue);
    },
  );

  group('DriverNotificationsNotifier.fetchNotifications', () {
    late _NotificationsApiInterceptor apiInterceptor;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      apiInterceptor = _NotificationsApiInterceptor();
      ApiClient.instance.dio.interceptors.add(apiInterceptor);
    });

    tearDown(() {
      ApiClient.instance.dio.interceptors.remove(apiInterceptor);
    });

    test('loads the backend notification envelope contract', () async {
      final notifier = DriverNotificationsNotifier();

      await notifier.fetchNotifications();

      expect(notifier.state.error, isNull);
      expect(notifier.state.notifications, hasLength(1));
      expect(notifier.state.notifications.single.id, 'notification-1');
      expect(notifier.state.unreadCount, 7);
    });

    test(
      'rejects legacy list responses instead of faking empty state',
      () async {
        apiInterceptor.payload = [_notificationPayload()];
        final notifier = DriverNotificationsNotifier();

        await notifier.fetchNotifications();

        expect(notifier.state.error, 'NOTIFICATIONS_CONTRACT_INVALID_RESPONSE');
        expect(notifier.state.notifications, isEmpty);
        expect(notifier.state.unreadCount, 0);
      },
    );

    test('rejects incomplete rows instead of dropping them', () async {
      apiInterceptor.payload = _notificationsEnvelope(
        notification: _notificationPayload()..remove('title'),
      );
      final notifier = DriverNotificationsNotifier();

      await notifier.fetchNotifications();

      expect(notifier.state.error, 'NOTIFICATIONS_CONTRACT_INVALID_RESPONSE');
      expect(notifier.state.notifications, isEmpty);
    });
  });

  test(
    'adds realtime notifications once while the driver app is open',
    () async {
      final transport = _NotificationRealtimeTransport();
      final notifier = DriverNotificationsNotifier(
        realtimeClient: RealtimeClient.forTesting(
          provider: RealtimeProvider.supabase,
          transport: transport,
          postCommand: (_, _) async {},
        ),
      );

      transport.addNotification(_notificationPayload());
      await Future<void>.delayed(Duration.zero);
      transport.addNotification(_notificationPayload());
      await Future<void>.delayed(Duration.zero);

      expect(notifier.state.notifications, hasLength(1));
      expect(notifier.state.notifications.single.id, 'notification-1');
      expect(notifier.state.unreadCount, 1);

      notifier.dispose();
      transport.dispose();
    },
  );
}

class _NotificationsApiInterceptor extends Interceptor {
  dynamic payload = _notificationsEnvelope();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/notifications' && options.method == 'GET') {
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

Map<String, dynamic> _notificationsEnvelope({
  Map<String, dynamic>? notification,
}) => {
  'notifications': [notification ?? _notificationPayload()],
  'unreadCount': 7,
  'meta': {'page': 1, 'limit': 20, 'total': 7},
};

Map<String, dynamic> _notificationPayload() => {
  'id': 'notification-1',
  'type': 'order_update',
  'title': 'Order ready',
  'body': 'Pick up now',
  'createdAt': '2026-07-03T12:00:00Z',
  'isRead': false,
  'data': {'eventType': 'order_update', 'deepLink': '/orders/order-1'},
};

class _NotificationRealtimeTransport implements RealtimeTransport {
  final _notifications = StreamController<Map<String, dynamic>>.broadcast();

  void addNotification(Map<String, dynamic> notification) {
    _notifications.add(notification);
  }

  @override
  bool get isConnected => true;

  @override
  Stream<Map<String, dynamic>> get onDriverLocation => const Stream.empty();

  @override
  Stream<Map<String, dynamic>> get onOrderStatus => const Stream.empty();

  @override
  Stream<Map<String, dynamic>> get onEtaUpdate => const Stream.empty();

  @override
  Stream<Map<String, dynamic>> get onNotification => _notifications.stream;

  @override
  Stream<Map<String, dynamic>> get onDriverOffer => const Stream.empty();

  @override
  Stream<Map<String, dynamic>> get onDriverOrderAssigned =>
      const Stream.empty();

  @override
  Stream<void> get onAuthRefreshRequired => const Stream.empty();

  @override
  Future<void> connect() async {}

  @override
  Future<void> disconnect() async {}

  @override
  Future<void> reconnectWithToken(String newToken) async {}

  @override
  Future<void> subscribeOrder(String orderId) async {}

  @override
  Future<void> unsubscribeOrder(String orderId) async {}

  @override
  void dispose() {
    _notifications.close();
  }
}
