import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:foodflow_customer/customer/screens/checkout_screen.dart';
import 'package:foodflow_customer/customer/screens/review_screen.dart';
import 'package:foodflow_customer/customer/providers/address_provider.dart';
import 'package:foodflow_customer/customer/providers/notification_provider.dart';
import 'package:foodflow_customer/l10n/app_localizations.dart';
import 'package:foodflow_customer/shared/providers/cart_provider.dart';
import 'package:foodflow_customer/shared/providers/order_provider.dart';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

Widget _wrap(Widget child, {List<Override>? overrides}) {
  return ProviderScope(
    overrides: overrides ?? const [],
    child: MaterialApp(
      locale: const Locale('vi'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: child,
    ),
  );
}

class _NoopAddressNotifier extends AddressNotifier {
  @override
  Future<void> fetchAddresses() async {}
}

class _NoopOrderNotifier extends OrderNotifier {
  @override
  Future<void> fetchOrderDetail(String orderId) async {}
}

// ---------------------------------------------------------------------------
// CartState unit tests — pure Dart, no widgets
// ---------------------------------------------------------------------------

void main() {
  group('CartState calculations', () {
    test('empty cart has zero subtotal and item count', () {
      const state = CartState();
      expect(state.subtotal, 0.0);
      expect(state.totalItemCount, 0);
      expect(state.isEmpty, true);
    });

    test('deliveryFee is 15000 when subtotal is below 100000', () {
      // Cart is empty → subtotal = 0 < 100000 → fee = 15000
      const state = CartState();
      expect(state.deliveryFee, 15000.0);
    });

    test('total equals subtotal + deliveryFee - discount', () {
      const state = CartState(discount: 5000.0);
      // subtotal = 0, deliveryFee = 15000, discount = 5000
      expect(state.total, 0.0 + 15000.0 - 5000.0);
    });
  });

  // -------------------------------------------------------------------------
  // NotificationModel.fromJson
  // -------------------------------------------------------------------------

  group('NotificationModel.fromJson', () {
    test('parses full JSON correctly', () {
      final json = {
        'id': 'n1',
        'type': 'order',
        'title': 'Đơn hàng mới',
        'body': 'Đơn đã được xác nhận',
        'createdAt': '2026-01-15T10:00:00.000Z',
        'isRead': false,
        'deepLink': '/orders/abc',
      };
      final model = NotificationModel.fromJson(json);

      expect(model.id, 'n1');
      expect(model.type, 'order');
      expect(model.title, 'Đơn hàng mới');
      expect(model.isRead, false);
      expect(model.deepLink, '/orders/abc');
    });

    test('uses defaults for missing optional fields', () {
      final model = NotificationModel.fromJson({'id': 'n2'});

      expect(model.type, 'system');
      expect(model.title, '');
      expect(model.body, '');
      expect(model.isRead, false);
      expect(model.deepLink, isNull);
    });

    test('copyWith isRead flips read status', () {
      final original = NotificationModel(
        id: 'n3',
        type: 'promo',
        title: 'Sale',
        body: 'Giảm 50%',
        createdAt: DateTime(2026, 1, 1),
        isRead: false,
      );
      final read = original.copyWith(isRead: true);

      expect(read.isRead, true);
      expect(read.id, original.id); // other fields unchanged
    });
  });

  // -------------------------------------------------------------------------
  // NotificationState
  // -------------------------------------------------------------------------

  group('NotificationState', () {
    test('copyWith preserves other fields when only one changes', () {
      const s = NotificationState(unreadCount: 5);
      final s2 = s.copyWith(isLoading: true);

      expect(s2.unreadCount, 5);
      expect(s2.isLoading, true);
    });

    test('error field is replaced (not merged) on copyWith', () {
      const s = NotificationState(error: 'Lỗi cũ');
      final s2 = s.copyWith(error: 'Lỗi mới');

      expect(s2.error, 'Lỗi mới');
    });
  });

  // -------------------------------------------------------------------------
  // CheckoutScreen widget tests
  // -------------------------------------------------------------------------

  group('CheckoutScreen', () {
    testWidgets('shows empty cart message when cart is empty', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const CheckoutScreen(),
          overrides: [
            addressProvider.overrideWith((ref) => _NoopAddressNotifier()),
          ],
        ),
      );
      await tester.pump();

      expect(find.text('Giỏ hàng trống'), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  // ReviewScreen widget tests
  // -------------------------------------------------------------------------

  group('ReviewScreen', () {
    testWidgets('renders rating bars and submit button', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const ReviewScreen(orderId: 'order-123'),
          overrides: [
            orderProvider.overrideWith((ref) => _NoopOrderNotifier()),
          ],
        ),
      );
      await tester.pump();

      expect(find.text('Chất lượng món ăn'), findsOneWidget);
      expect(find.text('Chất lượng giao hàng'), findsOneWidget);
      expect(find.text('Gửi đánh giá'), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  // OrderState unit tests
  // -------------------------------------------------------------------------

  group('OrderState', () {
    test('copyWith preserves active orders when only error changes', () {
      final s = OrderState(
        activeOrders: [],
        completedOrders: [],
        cancelledOrders: [],
      );
      final s2 = s.copyWith(error: 'fail');

      expect(s2.activeOrders, isEmpty);
      expect(s2.error, 'fail');
    });
  });
}
