import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/driver_status_provider.dart';
import '../providers/driver_provider.dart';
import '../widgets/online_toggle_switch.dart';
import '../../l10n/app_localizations.dart';

class OfflineStatusScreen extends ConsumerWidget {
  const OfflineStatusScreen({super.key});

  static const _pauseDurations = [
    Duration(minutes: 15),
    Duration(minutes: 30),
    Duration(hours: 1),
    Duration(hours: 2),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(driverStatusProvider);
    final driverState = ref.watch(driverProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driverStatusTitle,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const OnlineToggleSwitch(),
            const SizedBox(height: 20),
            _buildPauseSection(
              context,
              ref,
              status,
              l10n,
              isTransitioning: driverState.isLoading,
            ),
            const SizedBox(height: 24),
            _buildTodayStats(status, l10n),
            const SizedBox(height: 24),
            _buildInfoCard(l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildPauseSection(
    BuildContext context,
    WidgetRef ref,
    DriverStatus status,
    AppLocalizations l10n, {
    required bool isTransitioning,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
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
              const Icon(
                Icons.timer_outlined,
                color: Color(0xFFF59E0B),
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                l10n.driverStatusPauseTitle,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            l10n.driverStatusPauseSubtitle,
            style: const TextStyle(
              fontSize: 12,
              color: AppTextStyles.darkOnSurfaceVariant,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _pauseDurations.map((duration) {
              final isActive =
                  status.status == DriverOnlineStatus.paused &&
                  status.pausedDuration == duration;
              return Semantics(
                button: true,
                selected: isActive,
                label: _pauseLabel(l10n, duration),
                child: Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  child: InkWell(
                    onTap: isTransitioning
                        ? null
                        : () => ref
                              .read(driverStatusProvider.notifier)
                              .pauseFor(duration),
                    borderRadius: BorderRadius.circular(10),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(minHeight: 44),
                      child: Ink(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: isActive
                              ? const Color(0xFFF59E0B).withValues(alpha: 0.15)
                              : const Color(0xFF1F2937),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isActive
                                ? const Color(0xFFF59E0B)
                                : const Color(0xFF374151),
                          ),
                        ),
                        child: Text(
                          _pauseLabel(l10n, duration),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: isActive
                                ? const Color(0xFFF59E0B)
                                : Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          if (status.status == DriverOnlineStatus.paused) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isTransitioning
                    ? null
                    : () => ref.read(driverStatusProvider.notifier).resume(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                ),
                child: Text(l10n.driverStatusResumeNow),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTodayStats(DriverStatus status, AppLocalizations l10n) {
    final hours = status.totalOnlineToday.inHours;
    final minutes = status.totalOnlineToday.inMinutes % 60;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.driverStatusToday,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildMiniStat(
                  Icons.timer,
                  l10n.driverStatusOnlineTime,
                  _onlineDuration(l10n, hours, minutes),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(IconData icon, String label, String value) {
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primary, size: 22),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppTextStyles.darkOnSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildInfoCard(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: AppColors.primary, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              l10n.driverStatusInfoText,
              style: const TextStyle(
                fontSize: 13,
                color: AppTextStyles.darkOnSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _pauseLabel(AppLocalizations l10n, Duration duration) {
    if (duration.inHours >= 1) {
      return l10n.driverStatusPauseHours(duration.inHours);
    }
    return l10n.driverStatusPauseMinutes(duration.inMinutes);
  }

  String _onlineDuration(AppLocalizations l10n, int hours, int minutes) {
    if (hours > 0) {
      return l10n.driverStatusDurationHoursMinutes(hours, minutes);
    }
    return l10n.driverStatusDurationMinutes(minutes);
  }
}
