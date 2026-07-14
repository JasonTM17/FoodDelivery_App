import 'package:flutter/material.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/utils/notification_category.dart';
import '../providers/driver_notifications_provider.dart';

class DriverNotificationCard extends StatelessWidget {
  final DriverNotification notification;
  final AppLocalizations l10n;
  final VoidCallback onTap;

  const DriverNotificationCard({
    super.key,
    required this.notification,
    required this.l10n,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = _color(notification.type);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: notification.isRead
                ? Colors.transparent
                : color.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(_icon(notification.type), color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      if (!notification.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primary,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    notification.body,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFFD1D5DB),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _relativeTime(notification.createdAt),
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
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
        return Icons.shopping_bag_outlined;
      case NotificationCategory.promotion:
        return Icons.star_outline;
      case NotificationCategory.system:
      case NotificationCategory.other:
        return Icons.info_outline;
    }
  }

  Color _color(String type) {
    switch (notificationCategoryOf(type)) {
      case NotificationCategory.order:
        return AppColors.primary;
      case NotificationCategory.promotion:
        return AppColors.warning;
      case NotificationCategory.system:
      case NotificationCategory.other:
        return AppColors.info;
    }
  }

  String _relativeTime(DateTime createdAt) {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inMinutes < 1) return l10n.driver_notifications_now;
    if (diff.inHours < 1)
      return '${diff.inMinutes}${l10n.driver_notifications_minute_suffix}';
    if (diff.inDays < 1)
      return '${diff.inHours}${l10n.driver_notifications_hour_suffix}';
    return '${diff.inDays}${l10n.driver_notifications_day_suffix}';
  }
}
