import 'package:flutter/material.dart';
import '../../shared/theme/foodflow_colors.dart';

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

  factory StatusBadge.fromOrderStatus(String status) {
    final cfg = _configFor(status);
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

  static ({String label, Color bg, Color fg}) _configFor(String status) {
    Color c;
    String label;
    switch (status) {
      case 'pending':
        c = FoodFlowColors.orderPending;
        label = 'Chờ xác nhận';
      case 'confirmed':
        c = FoodFlowColors.orderConfirmed;
        label = 'Đã xác nhận';
      case 'preparing':
        c = FoodFlowColors.orderPreparing;
        label = 'Đang chuẩn bị';
      case 'delivering':
        c = FoodFlowColors.orderDelivering;
        label = 'Đang giao';
      case 'delivered':
        c = FoodFlowColors.orderDelivered;
        label = 'Đã giao';
      case 'cancelled':
        c = FoodFlowColors.orderCancelled;
        label = 'Đã hủy';
      default:
        c = FoodFlowColors.neutral400;
        label = status;
    }
    return (label: label, bg: c.withValues(alpha: 0.1), fg: c);
  }
}
