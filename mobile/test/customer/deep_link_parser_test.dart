import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/router/deep_link_parser.dart';
import 'package:foodflow_customer/customer/router/route_names.dart';

void main() {
  group('DeepLinkParser B-MOB-09', () {
    test('maps foodflow://orders/{id} to order-tracking with extra', () {
      final parsed = DeepLinkParser.parseWithExtras(
        'foodflow://orders/order-abc',
      );
      expect(parsed, isNotNull);
      expect(parsed!.path, Routes.orderTracking);
      expect(parsed.extra, 'order-abc');
    });

    test('maps foodflow://order/{id} to order-tracking with extra', () {
      final parsed = DeepLinkParser.parseWithExtras(
        'foodflow://order/order-xyz',
      );
      expect(parsed, isNotNull);
      expect(parsed!.path, Routes.orderTracking);
      expect(parsed.extra, 'order-xyz');
    });

    test('maps https://foodflow.vn/orders/{id}', () {
      final parsed = DeepLinkParser.parseWithExtras(
        'https://foodflow.vn/orders/order-99',
      );
      expect(parsed, isNotNull);
      expect(parsed!.path, Routes.orderTracking);
      expect(parsed.extra, 'order-99');
    });

    test('parse() returns order tracking path for /orders/{id}', () {
      expect(
        DeepLinkParser.parse('foodflow://orders/o1'),
        Routes.orderTracking,
      );
    });
  });
}
