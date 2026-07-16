import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../theme/app_colors.dart';
import '../utils/order_status_groups.dart';
import '../utils/order_status_labels.dart';

class OrderStatusBadge extends StatelessWidget {
  final String status;

  const OrderStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final config = _getStatusConfig(status, AppLocalizations.of(context));
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

  _StatusConfig _getStatusConfig(String status, AppLocalizations l10n) {
    switch (orderStatusGroup(status)) {
      case OrderStatusGroup.pending:
        return _StatusConfig(
          label: localizedOrderStatus(l10n, status),
          backgroundColor: AppColors.orderPending.withValues(alpha: 0.1),
          borderColor: AppColors.orderPending.withValues(alpha: 0.3),
          textColor: AppColors.orderPending,
        );
      case OrderStatusGroup.accepted:
        return _StatusConfig(
          label: localizedOrderStatus(l10n, status),
          backgroundColor: AppColors.orderConfirmed.withValues(alpha: 0.1),
          borderColor: AppColors.orderConfirmed.withValues(alpha: 0.3),
          textColor: AppColors.orderConfirmed,
        );
      case OrderStatusGroup.preparing:
        return _StatusConfig(
          label: localizedOrderStatus(l10n, status),
          backgroundColor: AppColors.orderPreparing.withValues(alpha: 0.1),
          borderColor: AppColors.orderPreparing.withValues(alpha: 0.3),
          textColor: AppColors.orderPreparing,
        );
      case OrderStatusGroup.delivering:
        return _StatusConfig(
          label: localizedOrderStatus(l10n, status),
          backgroundColor: AppColors.orderDelivering.withValues(alpha: 0.1),
          borderColor: AppColors.orderDelivering.withValues(alpha: 0.3),
          textColor: AppColors.orderDelivering,
        );
      case OrderStatusGroup.completed:
        return _StatusConfig(
          label: localizedOrderStatus(l10n, status),
          backgroundColor: AppColors.orderDelivered.withValues(alpha: 0.1),
          borderColor: AppColors.orderDelivered.withValues(alpha: 0.3),
          textColor: AppColors.orderDelivered,
        );
      case OrderStatusGroup.cancelled:
        return _StatusConfig(
          label: localizedOrderStatus(l10n, status),
          backgroundColor: AppColors.orderCancelled.withValues(alpha: 0.1),
          borderColor: AppColors.orderCancelled.withValues(alpha: 0.3),
          textColor: AppColors.orderCancelled,
        );
      case OrderStatusGroup.unknown:
        return _StatusConfig(
          label: localizedOrderStatus(l10n, status),
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
