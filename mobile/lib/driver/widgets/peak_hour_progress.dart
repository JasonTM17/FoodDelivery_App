import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/utils/currency_formatter.dart';

class PeakHourProgress extends StatelessWidget {
  final int completedOrders;
  final int targetOrders;
  final double bonusAmount;

  const PeakHourProgress({
    super.key,
    required this.completedOrders,
    required this.targetOrders,
    required this.bonusAmount,
  });

  double get _progress =>
      targetOrders > 0 ? (completedOrders / targetOrders).clamp(0.0, 1.0) : 0.0;

  bool get _isComplete => completedOrders >= targetOrders;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final formattedBonus = formatVnd(context, bonusAmount);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _isComplete
              ? const Color(0xFFF97316).withValues(alpha: 0.5)
              : const Color(0xFF374151),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.local_fire_department,
                    size: 16,
                    color: Color(0xFFF97316),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    l10n.driverPeakTitle,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Text(
                l10n.driverPeakProgress(completedOrders, targetOrders),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFF97316),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _progress,
              minHeight: 8,
              backgroundColor: const Color(0xFF374151),
              valueColor: const AlwaysStoppedAnimation<Color>(
                Color(0xFFF97316),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _isComplete
                ? l10n.driverPeakRewardEarned(formattedBonus)
                : l10n.driverPeakRewardRemaining(
                    targetOrders - completedOrders,
                    formattedBonus,
                  ),
            style: TextStyle(
              fontSize: 12,
              color: _isComplete
                  ? const Color(0xFFF97316)
                  : const Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }
}
