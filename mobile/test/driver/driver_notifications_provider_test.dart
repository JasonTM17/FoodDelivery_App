import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_notifications_provider.dart';

void main() {
  test('DriverNotification parses notification payload data safely', () {
    final createdAt = DateTime.parse('2026-07-03T12:00:00Z');
    final notification = DriverNotification.fromJson({
      'id': 'notification-1',
      'title': 'Order ready',
      'body': 'Pick up now',
      'createdAt': createdAt.toIso8601String(),
      'isRead': false,
      'data': {
        'eventType': 'order_update',
        'deepLink': '/orders/order-1',
      },
    });

    expect(notification.id, 'notification-1');
    expect(notification.type, 'order_update');
    expect(notification.deepLink, '/orders/order-1');
    expect(notification.createdAt, createdAt);
    expect(notification.isRead, isFalse);
  });

  test('DriverNotification copyWith marks notification read without losing fields', () {
    final notification = DriverNotification.fromJson({
      'id': 'notification-1',
      'type': 'system',
      'title': 'System',
      'body': 'Body',
      'createdAt': '2026-07-03T12:00:00Z',
    });

    final updated = notification.copyWith(isRead: true);

    expect(updated.id, notification.id);
    expect(updated.type, notification.type);
    expect(updated.isRead, isTrue);
  });
}
