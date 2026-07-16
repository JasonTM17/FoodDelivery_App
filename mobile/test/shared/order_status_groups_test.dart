import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/utils/order_status_groups.dart';

void main() {
  const expectedGroups = <String, OrderStatusGroup>{
    'created': OrderStatusGroup.pending,
    'pending_payment': OrderStatusGroup.pending,
    'paid': OrderStatusGroup.pending,
    'restaurant_pending': OrderStatusGroup.pending,
    'restaurant_accepted': OrderStatusGroup.accepted,
    'preparing': OrderStatusGroup.preparing,
    'ready_for_pickup': OrderStatusGroup.preparing,
    'driver_assigned': OrderStatusGroup.delivering,
    'driver_arriving_restaurant': OrderStatusGroup.delivering,
    'picked_up': OrderStatusGroup.delivering,
    'delivering': OrderStatusGroup.delivering,
    'delivered': OrderStatusGroup.completed,
    'completed': OrderStatusGroup.completed,
    'cancelled': OrderStatusGroup.cancelled,
    'refunded': OrderStatusGroup.cancelled,
  };

  test(
    'groups every backend order status into the customer history bucket',
    () {
      for (final entry in expectedGroups.entries) {
        expect(orderStatusGroup(entry.key), entry.value, reason: entry.key);
      }

      expect(isActiveOrderStatus('completed'), isFalse);
      expect(isActiveOrderStatus('refunded'), isFalse);
      expect(isActiveOrderStatus('restaurant_pending'), isTrue);
    },
  );

  test(
    'maps every active and completed backend status to a tracking phase',
    () {
      const expectedPhases = <String, int>{
        'created': 0,
        'pending_payment': 0,
        'paid': 0,
        'restaurant_pending': 0,
        'restaurant_accepted': 1,
        'preparing': 1,
        'ready_for_pickup': 1,
        'driver_assigned': 2,
        'driver_arriving_restaurant': 2,
        'picked_up': 2,
        'delivering': 2,
        'delivered': 3,
        'completed': 3,
      };

      for (final entry in expectedPhases.entries) {
        expect(
          orderTrackingPhaseIndex(entry.key),
          entry.value,
          reason: entry.key,
        );
      }

      expect(orderTrackingPhaseIndex('cancelled'), isNull);
      expect(orderTrackingPhaseIndex('refunded'), isNull);
    },
  );

  test('keeps legacy aliases compatible and unknown statuses fail neutral', () {
    expect(orderTrackingPhaseIndex('pending'), 0);
    expect(orderTrackingPhaseIndex('confirmed'), 1);
    expect(orderStatusGroup('canceled'), OrderStatusGroup.cancelled);
    expect(orderStatusGroup('future_status'), OrderStatusGroup.unknown);
    expect(orderTrackingPhaseIndex('future_status'), isNull);
    expect(isActiveOrderStatus('future_status'), isTrue);
  });
}
