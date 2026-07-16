import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/foodflow_colors.dart';
import '../../shared/utils/order_status_groups.dart';
import '../../shared/utils/order_status_labels.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final Color dotColor;

  const StatusBadge({
    super.key,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    Color? dotColor,
  }) : dotColor = dotColor ?? textColor;

  factory StatusBadge.fromOrderStatus(BuildContext context, String status) {
    final cfg = _configFor(status, AppLocalizations.of(context));
    return StatusBadge(
      label: cfg.label,
      backgroundColor: cfg.bg,
      textColor: cfg.fg,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: textColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  static ({String label, Color bg, Color fg}) _configFor(
    String status,
    AppLocalizations l10n,
  ) {
    final c = switch (orderStatusGroup(status)) {
      OrderStatusGroup.pending => FoodFlowColors.orderPending,
      OrderStatusGroup.accepted => FoodFlowColors.orderConfirmed,
      OrderStatusGroup.preparing => FoodFlowColors.orderPreparing,
      OrderStatusGroup.delivering => FoodFlowColors.orderDelivering,
      OrderStatusGroup.completed => FoodFlowColors.orderDelivered,
      OrderStatusGroup.cancelled => FoodFlowColors.orderCancelled,
      OrderStatusGroup.unknown => FoodFlowColors.neutral400,
    };
    return (
      label: localizedOrderStatus(l10n, status),
      bg: c.withValues(alpha: 0.1),
      fg: c,
    );
  }
}
