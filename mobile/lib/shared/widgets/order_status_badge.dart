import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class OrderStatusBadge extends StatelessWidget {
  final String status;

  const OrderStatusBadge({
    super.key,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final config = _getStatusConfig(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: config.backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: config.borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: config.textColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            config.label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: config.textColor,
            ),
          ),
        ],
      ),
    );
  }

  _StatusConfig _getStatusConfig(String status) {
    switch (status) {
      case 'pending':
        return _StatusConfig(
          label: 'Chờ xác nhận',
          backgroundColor: AppColors.orderPending.withValues(alpha: 0.1),
          borderColor: AppColors.orderPending.withValues(alpha: 0.3),
          textColor: AppColors.orderPending,
        );
      case 'confirmed':
        return _StatusConfig(
          label: 'Đã xác nhận',
          backgroundColor: AppColors.orderConfirmed.withValues(alpha: 0.1),
          borderColor: AppColors.orderConfirmed.withValues(alpha: 0.3),
          textColor: AppColors.orderConfirmed,
        );
      case 'preparing':
        return _StatusConfig(
          label: 'Đang chuẩn bị',
          backgroundColor: AppColors.orderPreparing.withValues(alpha: 0.1),
          borderColor: AppColors.orderPreparing.withValues(alpha: 0.3),
          textColor: AppColors.orderPreparing,
        );
      case 'delivering':
        return _StatusConfig(
          label: 'Đang giao',
          backgroundColor: AppColors.orderDelivering.withValues(alpha: 0.1),
          borderColor: AppColors.orderDelivering.withValues(alpha: 0.3),
          textColor: AppColors.orderDelivering,
        );
      case 'delivered':
        return _StatusConfig(
          label: 'Đã giao',
          backgroundColor: AppColors.orderDelivered.withValues(alpha: 0.1),
          borderColor: AppColors.orderDelivered.withValues(alpha: 0.3),
          textColor: AppColors.orderDelivered,
        );
      case 'cancelled':
        return _StatusConfig(
          label: 'Đã hủy',
          backgroundColor: AppColors.orderCancelled.withValues(alpha: 0.1),
          borderColor: AppColors.orderCancelled.withValues(alpha: 0.3),
          textColor: AppColors.orderCancelled,
        );
      default:
        return _StatusConfig(
          label: status,
          backgroundColor: AppColors.textHint.withValues(alpha: 0.1),
          borderColor: AppColors.textHint.withValues(alpha: 0.3),
          textColor: AppColors.textSecondary,
        );
    }
  }
}

class _StatusConfig {
  final String label;
  final Color backgroundColor;
  final Color borderColor;
  final Color textColor;

  _StatusConfig({
    required this.label,
    required this.backgroundColor,
    required this.borderColor,
    required this.textColor,
  });
}
