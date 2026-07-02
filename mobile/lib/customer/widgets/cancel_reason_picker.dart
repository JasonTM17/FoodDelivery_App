import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/cancel_order_provider.dart';

class CancelReasonPicker extends StatelessWidget {
  final CancelReason? selectedReason;
  final Function(CancelReason) onSelected;
  final Map<CancelReason, String> labels;

  const CancelReasonPicker({
    super.key,
    required this.selectedReason,
    required this.onSelected,
    required this.labels,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: CancelReason.values.map((reason) {
        final isSelected = selectedReason == reason;
        return GestureDetector(
          onTap: () => onSelected(reason),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary : AppColors.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.border,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _iconForReason(reason),
                  size: 16,
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                ),
                const SizedBox(width: 8),
                Text(
                  labels[reason] ?? '',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  IconData _iconForReason(CancelReason reason) {
    switch (reason) {
      case CancelReason.slow:
        return Icons.timer_outlined;
      case CancelReason.changedMind:
        return Icons.change_circle_outlined;
      case CancelReason.wrongOrder:
        return Icons.error_outline;
      case CancelReason.other:
        return Icons.more_horiz;
    }
  }
}
