import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/driver_status_provider.dart';

class OnlineToggleSwitch extends ConsumerWidget {
  const OnlineToggleSwitch({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(driverStatusProvider);

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
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isOnline
                  ? AppColors.primary
                  : isPaused
                  ? const Color(0xFFF59E0B)
                  : const Color(0xFF6B7280),
              boxShadow: isOnline
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.5),
                        blurRadius: 8,
                      ),
                    ]
                  : [],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isOnline
                    ? 'Đang trực tuyến'
                    : isPaused
                    ? 'Đang tạm dừng'
                    : 'Đang ngoại tuyến',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: isOnline
                      ? AppColors.primary
                      : isPaused
                      ? const Color(0xFFF59E0B)
                      : const Color(0xFF6B7280),
                ),
              ),
              Text(
                isOnline
                    ? 'Sẵn sàng nhận đơn'
                    : isPaused
                    ? 'Sẽ tự động offline khi hết giờ'
                    : 'Bật để nhận đơn hàng',
                style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
            ],
          ),
          const Spacer(),
          if (isPaused && status.pausedDuration != null)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Text(
                '${status.pausedDuration!.inMinutes}ph',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFF59E0B),
                ),
              ),
            ),
          SizedBox(
            height: 36,
            child: Switch(
              value: isOnline,
              onChanged: (value) {
                if (value) {
                  ref.read(driverStatusProvider.notifier).setOnline();
                } else {
                  ref.read(driverStatusProvider.notifier).setOffline();
                }
              },
              activeTrackColor: AppColors.primary,
              inactiveThumbColor: const Color(0xFF6B7280),
              inactiveTrackColor: const Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
  }
}
