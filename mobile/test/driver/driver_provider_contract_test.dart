import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/driver_provider.dart'
    show DispatchOffer, DriverEarnings;

void main() {
  group('DispatchOffer contract', () {
    test('parses the canonical /dispatch driver:new_order payload', () {
      final offer = DispatchOffer.fromJson({
        'orderId': 'order-001',
        'offerToken': 'offer-token-001',
        'restaurantName': 'Pho 24',
        'restaurantAddress': '1 Hai Ba Trung, District 1',
        'deliveryAddress': '123 Le Loi, District 1',
        'orderTotal': 145000,
        'deliveryFee': 18000,
        'distanceKm': 2.4,
        'timeoutSeconds': 30,
        'surgeMultiplier': 1.2,
      });

      expect(offer.orderId, 'order-001');
      expect(offer.offerToken, 'offer-token-001');
      expect(offer.restaurantAddress, contains('Hai Ba Trung'));
      expect(offer.deliveryFee, 18000);
      expect(offer.timeoutSeconds, 30);
      expect(offer.surgeMultiplier, 1.2);
    });

    test('rejects offers that omit the server offer token', () {
      expect(
        () => DispatchOffer.fromJson({
          'orderId': 'order-001',
          'restaurantName': 'Pho 24',
          'restaurantAddress': '1 Hai Ba Trung, District 1',
          'deliveryAddress': '123 Le Loi, District 1',
          'orderTotal': 145000,
          'deliveryFee': 18000,
          'distanceKm': 2.4,
          'timeoutSeconds': 30,
          'surgeMultiplier': 1.0,
        }),
        throwsA(isA<FormatException>()),
      );
    });
  });

  group('DriverEarnings contract', () {
    test('parses payout-ledger earnings response', () {
      final earnings = DriverEarnings.fromJson({
        'totalEarnings': 100000,
        'totalOrders': 2,
        'averagePerOrder': 50000,
        'entries': [
          {
            'orderId': 'order-001',
            'orderCode': 'FF-20260703-0001',
            'restaurantName': 'Pho 24',
            'amount': 50000,
            'completedAt': '2026-07-03T08:30:00Z',
          },
          {
            'orderId': 'order-002',
            'orderCode': 'FF-20260703-0002',
            'restaurantName': 'Bun Bo Hue Ngon',
            'amount': 50000,
            'completedAt': '2026-07-03T09:30:00Z',
          },
        ],
      });

      expect(earnings.total, 100000);
      expect(earnings.orderCount, 2);
      expect(earnings.averagePerOrder, 50000);
      expect(earnings.entries, hasLength(2));
      expect(earnings.entries.first.orderCode, 'FF-20260703-0001');
    });

    test('rejects legacy earnings payload without entries', () {
      expect(
        () => DriverEarnings.fromJson({
          'period': 'today',
          'totalEarnings': 100000,
          'deliveryCount': 2,
          'tips': 0,
        }),
        throwsA(isA<FormatException>()),
      );
    });
  });
}
