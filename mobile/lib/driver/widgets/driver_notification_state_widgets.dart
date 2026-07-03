import 'package:flutter/material.dart';

import '../../shared/theme/app_colors.dart';

class DriverNotificationsTitle extends StatelessWidget {
  final String title;
  final int unread;

  const DriverNotificationsTitle({super.key, required this.title, required this.unread});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
        ),
        if (unread > 0) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(12)),
            child: Text(
              '$unread',
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ],
    );
  }
}

class DriverNotificationEmpty extends StatelessWidget {
  final String title;
  final String subtitle;

  const DriverNotificationEmpty({super.key, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 120),
        const Icon(Icons.notifications_none_outlined, size: 48, color: Color(0xFF6B7280)),
        const SizedBox(height: 12),
        Text(title, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white)),
        const SizedBox(height: 4),
        Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF6B7280))),
      ],
    );
  }
}

class DriverNotificationError extends StatelessWidget {
  final String message;
  final String detail;
  final String retryLabel;
  final VoidCallback onRetry;

  const DriverNotificationError({
    super.key,
    required this.message,
    required this.detail,
    required this.retryLabel,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Color(0xFFF87171), size: 44),
            const SizedBox(height: 12),
            Text(message, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(detail, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF9CA3AF))),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: Text(retryLabel)),
          ],
        ),
      ),
    );
  }
}
