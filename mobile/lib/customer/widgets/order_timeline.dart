import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/models/order.dart';

class OrderTimeline extends StatelessWidget {
  final String currentStatus;
  final List<StatusHistory> history;

  const OrderTimeline({
    super.key,
    required this.currentStatus,
    this.history = const [],
  });

  static const _steps = [
    _Step('pending', 'Chờ xác nhận', Icons.access_time_rounded),
    _Step('confirmed', 'Đã xác nhận', Icons.check_circle_outline),
    _Step('preparing', 'Đang chuẩn bị', Icons.restaurant_rounded),
    _Step('delivering', 'Đang giao', Icons.delivery_dining_rounded),
    _Step('delivered', 'Đã giao', Icons.check_circle_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final isCancelled = currentStatus == 'cancelled';
    final activeIndex = isCancelled
        ? -1
        : _steps.indexWhere((s) => s.status == currentStatus);

    return Column(
      children: [
        ..._steps.asMap().entries.map((entry) {
          final i = entry.key;
          final step = entry.value;
          return _TimelineRow(
            step: step,
            isDone: !isCancelled && i < activeIndex,
            isActive: !isCancelled && i == activeIndex,
            isLast: i == _steps.length - 1 && !isCancelled,
            timestamp: _timestampFor(step.status),
          );
        }),
        if (isCancelled)
          _CancelledRow(timestamp: _timestampFor('cancelled')),
      ],
    );
  }

  String? _timestampFor(String status) {
    final entry = history.where((h) => h.status == status).lastOrNull;
    if (entry == null) return null;
    final dt = entry.timestamp;
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

class _Step {
  final String status;
  final String label;
  final IconData icon;
  const _Step(this.status, this.label, this.icon);
}

class _TimelineRow extends StatelessWidget {
  final _Step step;
  final bool isDone;
  final bool isActive;
  final bool isLast;
  final String? timestamp;

  const _TimelineRow({
    required this.step,
    required this.isDone,
    required this.isActive,
    required this.isLast,
    this.timestamp,
  });

  @override
  Widget build(BuildContext context) {
    final dotColor = isDone || isActive ? AppColors.primary : AppColors.border;
    final labelColor = isActive
        ? AppColors.textPrimary
        : isDone
            ? AppColors.textSecondary
            : AppColors.textHint;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 32,
            child: Column(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: (isDone || isActive) ? AppColors.primary : AppColors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: dotColor, width: 2),
                  ),
                  child: Icon(
                    isDone ? Icons.check : step.icon,
                    size: 14,
                    color: (isDone || isActive) ? Colors.white : AppColors.textHint,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: isDone ? AppColors.primary : AppColors.border,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text(
                    step.label,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                      color: labelColor,
                    ),
                  ),
                  if (timestamp != null)
                    Text(timestamp!, style: AppTextStyles.caption),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CancelledRow extends StatelessWidget {
  final String? timestamp;
  const _CancelledRow({this.timestamp});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 32,
          child: Container(
            width: 28,
            height: 28,
            decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
            child: const Icon(Icons.close, size: 14, color: Colors.white),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Đã hủy',
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.error,
                  ),
                ),
                if (timestamp != null) Text(timestamp!, style: AppTextStyles.caption),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
