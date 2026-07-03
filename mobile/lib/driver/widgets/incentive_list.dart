import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/incentives_provider.dart';

class IncentiveList extends StatelessWidget {
  const IncentiveList({
    super.key,
    required this.incentives,
    required this.l10n,
  });

  final List<DriverIncentive> incentives;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    if (incentives.isEmpty) {
      return Center(
        child: Text(
          l10n.driver_incentives_empty,
          style: const TextStyle(color: Color(0xFF6B7280)),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: incentives.length,
      itemBuilder: (_, i) => _IncentiveCard(item: incentives[i], l10n: l10n),
    );
  }
}

class IncentiveErrorState extends StatelessWidget {
  const IncentiveErrorState({
    super.key,
    required this.l10n,
    required this.onRetry,
  });

  final AppLocalizations l10n;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.wifi_off_outlined,
            color: Color(0xFF6B7280),
            size: 48,
          ),
          const SizedBox(height: 12),
          Text(
            l10n.driver_incentives_error,
            style: const TextStyle(color: Color(0xFF9CA3AF)),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: onRetry,
            child: Text(l10n.driver_incentives_retry),
          ),
        ],
      ),
    );
  }
}

class _IncentiveCard extends StatelessWidget {
  const _IncentiveCard({required this.item, required this.l10n});

  final DriverIncentive item;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final progress = item.target <= 0 ? 0.0 : item.progress / item.target;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
              if (item.completed) _CompletedBadge(),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              backgroundColor: const Color(0xFF374151),
              valueColor: AlwaysStoppedAnimation<Color>(
                item.completed ? Colors.green : AppColors.primary,
              ),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.driver_incentives_progress(item.progress, item.target),
                style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
              ),
              Text(
                l10n.driver_incentives_reward(_formatVnd(item.rewardAmount)),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            l10n.driver_incentives_expires(_formatDate(context, item.endsAt)),
            style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _CompletedBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.green.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Text(
        '✓',
        style: TextStyle(color: Colors.green, fontSize: 12),
      ),
    );
  }
}

String _formatVnd(int amount) {
  final text = amount.toString().replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => ',',
  );
  return '${text}đ';
}

String _formatDate(BuildContext context, String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  return MaterialLocalizations.of(context).formatShortDate(parsed.toLocal());
}
