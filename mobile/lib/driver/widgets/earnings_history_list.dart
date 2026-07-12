import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/utils/currency_formatter.dart';
import '../providers/driver_provider.dart';

class EarningsHistoryList extends StatelessWidget {
  const EarningsHistoryList({
    super.key,
    required this.earnings,
    required this.l10n,
  });

  final DriverEarnings? earnings;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    if (earnings == null || earnings!.entries.isEmpty) {
      return _EarningsEmptyState(l10n: l10n);
    }
    return Column(
      children: earnings!.entries
          .map((entry) => _EarningEntryCard(entry: entry, l10n: l10n))
          .toList(growable: false),
    );
  }
}

class _EarningEntryCard extends StatelessWidget {
  const _EarningEntryCard({required this.entry, required this.l10n});

  final DriverEarningEntry entry;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.check_circle_outline,
              color: AppColors.primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.restaurantName,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  l10n.driverRatingsOrder(
                    entry.orderCode.isNotEmpty
                        ? entry.orderCode
                        : entry.orderId.substring(0, 8).toUpperCase(),
                  ),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatSignedVnd(context, entry.amount),
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
              Text(
                _formatDate(entry.completedAt, l10n),
                style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EarningsEmptyState extends StatelessWidget {
  const _EarningsEmptyState({required this.l10n});

  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      child: Column(
        children: [
          Icon(
            Icons.monetization_on_outlined,
            size: 56,
            color: AppColors.textSecondary.withValues(alpha: 0.4),
          ),
          const SizedBox(height: 16),
          Text(
            l10n.driverEarningsEmpty,
            style: const TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }
}

String _formatDate(DateTime date, AppLocalizations l10n) {
  final now = DateTime.now();
  final diff = now.difference(date);
  if (diff.inDays == 0) return l10n.driverRatingsToday;
  if (diff.inDays == 1) return l10n.driverRatingsYesterday;
  return '${date.day}/${date.month}';
}
