enum OrderStatusGroup {
  pending,
  accepted,
  preparing,
  delivering,
  completed,
  cancelled,
  unknown,
}

OrderStatusGroup orderStatusGroup(String status) {
  return switch (status) {
    'created' ||
    'pending_payment' ||
    'paid' ||
    'restaurant_pending' ||
    'pending' => OrderStatusGroup.pending,
    'restaurant_accepted' || 'confirmed' => OrderStatusGroup.accepted,
    'preparing' || 'ready_for_pickup' => OrderStatusGroup.preparing,
    'driver_assigned' ||
    'driver_arriving_restaurant' ||
    'picked_up' ||
    'delivering' => OrderStatusGroup.delivering,
    'delivered' || 'completed' => OrderStatusGroup.completed,
    'cancelled' || 'canceled' || 'refunded' => OrderStatusGroup.cancelled,
    _ => OrderStatusGroup.unknown,
  };
}

bool isActiveOrderStatus(String status) {
  final group = orderStatusGroup(status);
  return group != OrderStatusGroup.completed &&
      group != OrderStatusGroup.cancelled;
}

int? orderTrackingPhaseIndex(String status) {
  return switch (orderStatusGroup(status)) {
    OrderStatusGroup.pending => 0,
    OrderStatusGroup.accepted || OrderStatusGroup.preparing => 1,
    OrderStatusGroup.delivering => 2,
    OrderStatusGroup.completed => 3,
    OrderStatusGroup.cancelled || OrderStatusGroup.unknown => null,
  };
}
