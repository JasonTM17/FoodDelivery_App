import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/utils/notification_category.dart';
import '../providers/notification_provider.dart';

class NotificationTile extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback? onTap;

  const NotificationTile({super.key, required this.notification, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        color: notification.isRead
            ? null
            : AppColors.primary.withValues(alpha: 0.04),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _iconColor(notification.type).withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _icon(notification.type),
                size: 20,
                color: _iconColor(notification.type),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _typeLabel(notification.type),
                      const SizedBox(width: 8),
                      Text(
                        notification.title,
                        style: AppTextStyles.bodyMedium.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: AppTextStyles.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (!notification.isRead)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 4, left: 8),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  IconData _icon(String type) {
    switch (notificationCategoryOf(type)) {
      case NotificationCategory.order:
        return Icons.receipt_long_outlined;
      case NotificationCategory.promotion:
        return Icons.local_offer_outlined;
      case NotificationCategory.system:
      case NotificationCategory.other:
        return Icons.notifications_none_outlined;
    }
  }

  Color _iconColor(String type) {
    switch (notificationCategoryOf(type)) {
      case NotificationCategory.order:
        return AppColors.info;
      case NotificationCategory.promotion:
        return AppColors.accent;
      case NotificationCategory.system:
      case NotificationCategory.other:
        return AppColors.textSecondary;
    }
  }

  Widget _typeLabel(String type) {
    final String label;
    final Color color;
    switch (notificationCategoryOf(type)) {
      case NotificationCategory.order:
        label = 'Đơn hàng';
        color = AppColors.info;
        break;
      case NotificationCategory.promotion:
        label = 'Khuyến mãi';
        color = AppColors.accent;
        break;
      case NotificationCategory.system:
      case NotificationCategory.other:
        label = 'Hệ thống';
        color = AppColors.textSecondary;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: AppTextStyles.caption.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 10,
        ),
      ),
    );
  }
}
