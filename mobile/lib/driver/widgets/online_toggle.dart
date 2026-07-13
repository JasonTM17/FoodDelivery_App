import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/driver_provider.dart';
import '../providers/driver_status_provider.dart';

class OnlineToggle extends ConsumerWidget {
  const OnlineToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final driverState = ref.watch(driverProvider);
    final status = ref.watch(driverStatusProvider);
    final l10n = AppLocalizations.of(context);
    final isOnline = status.status == DriverOnlineStatus.online;
    final isPaused = status.status == DriverOnlineStatus.paused;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isOnline
              ? AppColors.primary.withValues(alpha: 0.3)
              : isPaused
              ? const Color(0xFFF59E0B).withValues(alpha: 0.3)
              : const Color(0xFF374151),
        ),
      ),
      child: Row(
        children: [
          _StatusDot(isOnline: isOnline, isPaused: isPaused),
          const SizedBox(width: 12),
          _StatusLabel(isOnline: isOnline, isPaused: isPaused, l10n: l10n),
          const Spacer(),
          SizedBox(
            height: 48,
            child: Switch(
              value: isOnline,
              onChanged: driverState.isLoading
                  ? null
                  : (value) {
                      if (value) {
                        ref.read(driverStatusProvider.notifier).setOnline();
                      } else {
                        ref.read(driverStatusProvider.notifier).setOffline();
                      }
                    },
              activeTrackColor: AppColors.primary,
              inactiveThumbColor: AppColors.textHint,
              inactiveTrackColor: const Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusDot extends StatelessWidget {
  final bool isOnline;
  final bool isPaused;
  const _StatusDot({required this.isOnline, required this.isPaused});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isOnline
            ? AppColors.primary
            : isPaused
            ? const Color(0xFFF59E0B)
            : AppColors.textHint,
        boxShadow: isOnline
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.5),
                  blurRadius: 8,
                ),
              ]
            : [],
      ),
    );
  }
}

class _StatusLabel extends StatelessWidget {
  final bool isOnline;
  final bool isPaused;
  final AppLocalizations l10n;
  const _StatusLabel({
    required this.isOnline,
    required this.isPaused,
    required this.l10n,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isOnline
              ? l10n.driverOnlineStatusOnline
              : isPaused
              ? l10n.driverOnlineStatusPaused
              : l10n.driverOnlineStatusOffline,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: isOnline
                ? AppColors.primary
                : isPaused
                ? const Color(0xFFF59E0B)
                : AppTextStyles.darkOnSurfaceVariant,
          ),
        ),
        Text(
          isOnline
              ? l10n.driverOnlineReady
              : isPaused
              ? l10n.driverOnlineAutoOffline
              : l10n.driverOnlineEnable,
          style: const TextStyle(
            fontSize: 12,
            color: AppTextStyles.darkOnSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
