import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/driver_status_provider.dart';
import '../widgets/online_toggle_switch.dart';


class OfflineStatusScreen extends ConsumerWidget {
  const OfflineStatusScreen({super.key});

  static const _pauseOptions = [
    ('15 phút', Duration(minutes: 15)),
    ('30 phút', Duration(minutes: 30)),
    ('1 giờ', Duration(hours: 1)),
    ('2 giờ', Duration(hours: 2)),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(driverStatusProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: const Text(
          'Trạng thái hoạt động',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const OnlineToggleSwitch(),
            const SizedBox(height: 20),
            _buildPauseSection(context, ref, status),
            const SizedBox(height: 24),
            _buildTodayStats(status),
            const SizedBox(height: 24),
            _buildInfoCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildPauseSection(
    BuildContext context,
    WidgetRef ref,
    DriverStatus status,
  ) {
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
          const Row(
            children: [
              Icon(Icons.timer_outlined, color: Color(0xFFF59E0B), size: 18),
              SizedBox(width: 8),
              Text(
                'Tạm dừng nhận đơn',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Tạm dừng trong một khoảng thời gian, sau đó tự động trở lại trực tuyến',
            style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _pauseOptions.map((option) {
              final isActive =
                  status.status == DriverOnlineStatus.paused &&
                  status.pausedDuration == option.$2;
              return GestureDetector(
                onTap: () => ref
                    .read(driverStatusProvider.notifier)
                    .pauseFor(option.$2),
                child: Container(
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
                    option.$1,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isActive
                          ? const Color(0xFFF59E0B)
                          : Colors.white,
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
                onPressed: () =>
                    ref.read(driverStatusProvider.notifier).resume(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                ),
                child: const Text('Tiếp tục nhận đơn ngay'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTodayStats(DriverStatus status) {
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
          const Text(
            'Hôm nay',
            style: TextStyle(
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
                  'Thời gian online',
                  hours > 0 ? '${hours}h ${minutes}m' : '0m',
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
          style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline, color: AppColors.primary, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Khi trực tuyến, bạn sẽ nhận được thông báo đơn hàng mới trong khu vực hoạt động.',
              style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
            ),
          ),
        ],
      ),
    );
  }
}
