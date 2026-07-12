import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';

class DeliveryStepIndicator extends StatelessWidget {
  final int currentStep;

  const DeliveryStepIndicator({super.key, required this.currentStep});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final labels = [
      l10n.driverStepRestaurant,
      l10n.driverStepPickup,
      l10n.driverStepDeliver,
      l10n.driverStepComplete,
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        children: List.generate(labels.length * 2 - 1, (index) {
          if (index.isOdd) return _buildConnector(index ~/ 2);
          final stepIndex = index ~/ 2;
          return _buildStep(stepIndex, labels[stepIndex]);
        }),
      ),
    );
  }

  Widget _buildStep(int index, String label) {
    final isCompleted = index < currentStep;
    final isCurrent = index == currentStep;

    Color bgColor;
    Color textColor;
    Color borderColor;

    if (isCompleted) {
      bgColor = AppColors.primary;
      textColor = Colors.white;
      borderColor = AppColors.primary;
    } else if (isCurrent) {
      bgColor = AppColors.primary.withValues(alpha: 0.15);
      textColor = AppColors.primary;
      borderColor = AppColors.primary;
    } else {
      bgColor = Colors.transparent;
      textColor = const Color(0xFF6B7280);
      borderColor = const Color(0xFF374151);
    }

    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
              border: Border.all(color: borderColor, width: 2),
            ),
            child: isCompleted
                ? const Icon(Icons.check, size: 18, color: Colors.white)
                : Center(
                    child: Text(
                      '${index + 1}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                  ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
              color: textColor,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildConnector(int index) {
    final isCompleted = index < currentStep;
    return SizedBox(
      width: 24,
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 24),
        color: isCompleted ? AppColors.primary : const Color(0xFF374151),
      ),
    );
  }
}
