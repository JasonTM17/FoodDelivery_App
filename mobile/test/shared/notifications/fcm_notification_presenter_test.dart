import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/notifications/fcm_notification_presenter.dart';

void main() {
  test('accepts a local notification deep link', () {
    expect(
      fcmDeepLinkFromData({'deepLink': '/orders/order-1?source=push'}),
      '/orders/order-1?source=push',
    );
  });

  test('rejects missing, external, and malformed notification deep links', () {
    for (final data in [
      <String, dynamic>{},
      {'deepLink': ''},
      {'deepLink': 'https://example.com/orders/order-1'},
      {'deepLink': '//example.com/orders/order-1'},
      {'deepLink': 'orders/order-1'},
      {'deepLink': 42},
    ]) {
      expect(fcmDeepLinkFromData(data), isNull);
    }
  });
}
