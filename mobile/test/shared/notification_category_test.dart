import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/utils/notification_category.dart';

void main() {
  test('classifies canonical order event types', () {
    const types = [
      'order',
      'order_update',
      'order_created',
      'order_accepted',
      'driver_assigned',
      'delivered',
      'cancelled',
      'refunded',
    ];

    for (final type in types) {
      expect(
        notificationCategoryOf(type),
        NotificationCategory.order,
        reason: type,
      );
    }
  });

  test('classifies canonical promotion and system event types', () {
    expect(notificationCategoryOf('promo'), NotificationCategory.promotion);
    expect(notificationCategoryOf('promotion'), NotificationCategory.promotion);
    expect(
      notificationCategoryOf('promotion.broadcast'),
      NotificationCategory.promotion,
    );
    expect(notificationCategoryOf('promo_new'), NotificationCategory.promotion);
    expect(notificationCategoryOf('system_alert'), NotificationCategory.system);
    expect(notificationCategoryOf('driver_alert'), NotificationCategory.system);
    expect(notificationCategoryOf('kyc_approved'), NotificationCategory.system);
    expect(notificationCategoryOf('kyc_rejected'), NotificationCategory.system);
  });

  test('keeps unrelated event types outside named tabs', () {
    expect(notificationCategoryOf('support.reply'), NotificationCategory.other);
    expect(notificationCategoryOf('review.new'), NotificationCategory.other);
    expect(notificationCategoryOf('chat'), NotificationCategory.other);
  });
}
