enum NotificationCategory { order, promotion, system, other }

const _orderTypes = {
  'order',
  'order_update',
  'order_created',
  'order_accepted',
  'driver_assigned',
  'delivered',
  'cancelled',
  'refunded',
};

NotificationCategory notificationCategoryOf(String type) {
  final normalized = type.trim().toLowerCase();
  if (_orderTypes.contains(normalized) ||
      normalized.startsWith('order_') ||
      normalized.startsWith('order.')) {
    return NotificationCategory.order;
  }
  if (normalized == 'promo' ||
      normalized == 'promotion' ||
      normalized.startsWith('promo_') ||
      normalized.startsWith('promo.') ||
      normalized.startsWith('promotion_') ||
      normalized.startsWith('promotion.')) {
    return NotificationCategory.promotion;
  }
  if (normalized == 'system' ||
      normalized == 'driver_alert' ||
      normalized == 'kyc_approved' ||
      normalized == 'kyc_rejected' ||
      normalized.startsWith('system_') ||
      normalized.startsWith('system.')) {
    return NotificationCategory.system;
  }
  return NotificationCategory.other;
}
