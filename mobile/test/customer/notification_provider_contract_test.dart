import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/notification_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('NotificationNotifier.fetchNotifications', () {
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
      final notifier = NotificationNotifier();

      await notifier.fetchNotifications();

      expect(notifier.state.error, isNull);
      expect(notifier.state.notifications, hasLength(1));
      expect(notifier.state.notifications.single.id, 'notification-1');
      expect(notifier.state.notifications.single.deepLink, '/orders/order-1');
      expect(notifier.state.unreadCount, 3);

      notifier.dispose();
    });

    test(
      'rejects legacy list responses instead of recomputing unread count',
      () async {
        apiInterceptor.payload = [_notificationPayload()];
        final notifier = NotificationNotifier();

        await notifier.fetchNotifications();

        expect(notifier.state.error, 'NOTIFICATIONS_CONTRACT_INVALID_RESPONSE');
        expect(notifier.state.notifications, isEmpty);
        expect(notifier.state.unreadCount, 0);

        notifier.dispose();
      },
    );

    test(
      'rejects incomplete rows instead of rendering blank notifications',
      () async {
        apiInterceptor.payload = _notificationsEnvelope(
          notification: _notificationPayload()..remove('body'),
        );
        final notifier = NotificationNotifier();

        await notifier.fetchNotifications();

        expect(notifier.state.error, 'NOTIFICATIONS_CONTRACT_INVALID_RESPONSE');
        expect(notifier.state.notifications, isEmpty);

        notifier.dispose();
      },
    );

    test(
      'rejects missing unreadCount instead of deriving fallback state',
      () async {
        apiInterceptor.payload = _notificationsEnvelope()
          ..remove('unreadCount');
        final notifier = NotificationNotifier();

        await notifier.fetchNotifications();

        expect(notifier.state.error, 'NOTIFICATIONS_CONTRACT_INVALID_RESPONSE');
        expect(notifier.state.unreadCount, 0);

        notifier.dispose();
      },
    );
  });
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
  'unreadCount': 3,
  'meta': {'page': 1, 'limit': 20, 'total': 3},
};

Map<String, dynamic> _notificationPayload() => {
  'id': 'notification-1',
  'type': 'order_update',
  'title': 'Order update',
  'body': 'Your order is being prepared',
  'createdAt': '2026-07-03T12:00:00Z',
  'isRead': false,
  'data': {'eventType': 'order_update', 'deepLink': '/orders/order-1'},
};
